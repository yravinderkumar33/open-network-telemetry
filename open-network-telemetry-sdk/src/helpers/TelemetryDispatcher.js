import { RedisClient } from "../utils/RedisUtil.js";
import axios from "axios";
import { createTelemetryEvent, generateCheckSum } from "./EventGenerator.js";
import archiver from "archiver";
import { promises as fsPromises } from 'fs';
import fs from 'fs';
import path from "path";
import unzipper from "unzipper";
import axiosRetry from "axios-retry";


export class TelemetryDispatcher {
    constructor(config) {
        this.config = config;
        this.localStorage = {};
        this.redisClient = null;
        this.isSyncing = false;

        if (config.telemetry.storageType.toLowerCase() === 'redis') {
            this.redisClient = new RedisClient(config);
        }
        axiosRetry(axios, { retries: this.config.telemetry.retry, retryDelay: axiosRetry.exponentialDelay });
    }

    async storeData(event, eventType) {
        if (this.redisClient) {
            await this.redisClient.pushList(eventType, JSON.stringify(event));
        } else {
            if (!this.localStorage[eventType]) {
                this.localStorage[eventType] = [];
            }
            this.localStorage[eventType].push(event);
        }
    }

    async getDataSize(eventType) {
        if (this.redisClient) {
            const size = await this.redisClient.getListLength(eventType);
            return size
        } else {
            return this.localStorage[eventType] ? this.localStorage[eventType].length : 0;
        }
    }

    async getData(eventType) {
        if (this.redisClient) {
            const redisData = await this.redisClient.getList(eventType);
            if (redisData.length === 0) {
                return [];
            }
            return redisData.map(value => JSON.parse(value));
        } else {
            return this.localStorage[eventType] || [];
        }
    }

    async flushData(eventType) {
        if (this.redisClient) {
            await this.redisClient.delKey(eventType);
        } else {
            this.localStorage[eventType] = [];
        }
        console.log('Data is flushed successfully')
    }

    async processTelemetry(request, response, eventType) {
        const dataType = this.getDataType(eventType);
        if (this.config.telemetry[dataType].url !== '') {
            const event = createTelemetryEvent(request, response, eventType, this.config);

            await this.storeData(event, `${dataType}-event`);
            console.log(`${dataType} telemetry event generated :: api action: ${request?.context?.action} :: message id: ${request?.context?.message_id}`);

            const dataSize = await this.getDataSize(`${dataType}-event`);
            if (dataSize >= this.config.telemetry.batchSize) {
                await this.syncTelemetry();
            }
        }
    }

    async syncTelemetry() {
        const eventTypeList = ['api', 'raw']
        if (!this.isSyncing) {
            this.isSyncing = true;
            console.log('Started syncing telemetry...');
            for (const eventType of eventTypeList) {
                let dataType = this.getDataType(eventType);
                let dataSize = await this.getDataSize(`${dataType}-event`);
                console.log(`Stored ${dataType} data size: ${dataSize}`);
                if (dataSize > 0) {
                    try {
                        const payload = Object.values(await this.getData(`${dataType}-event`)).flat();
                        await this.pushToTelemetryServer(dataType, payload);
                        
                        console.log(`${dataType} data is successfully pushed to server!!!`);

                        await this.flushData(`${dataType}-event`);
                        await this.processBackupFiles();
                    } catch (error) {
                        console.error(`Error while pushing ${dataType} data to server: `, error.message);
                        if (this.config.telemetry.storageType.toLowerCase() === 'local') {
                            this.createBackup(dataType, Object.values(await this.getData(`${dataType}-event`)).flat());
                        }
                    } finally {
                        this.localStorage[`${dataType}-event`] = [];
                    }
                }

            }
            this.isSyncing = false;
            console.log('Finished syncing telemetry...');
        }
    }

    async createBackup(dataType, payloadData) {
        const backupFolderPath = this.config.telemetry.backupFilePath || 'backups';
        await fsPromises.access(backupFolderPath)
            .then(() => true)
            .catch(() => fsPromises.mkdir(backupFolderPath, { recursive: true }));
        const fileName = `telemetry_${dataType}_data_${Date.now()}`;
        const zipFileName = `telemetry_${dataType}_data_${Date.now()}.zip`;
        const zipStream = fs.createWriteStream(`${backupFolderPath}/${zipFileName}`);
        const archive = archiver('zip');

        archive.pipe(zipStream);
        archive.append(JSON.stringify({ type: dataType, payload: payloadData }), { name: `${fileName}.json` });
        archive.finalize();

        console.log(`Data stored locally in file: ${zipFileName}`);
    }


    async processBackupFiles() {
        const backupFolderPath = this.config.telemetry.backupFilePath || 'backups';
        await fsPromises.access(backupFolderPath)
            .then(() => true)
            .catch(() => fsPromises.mkdir(backupFolderPath, { recursive: true }));
        let files = await fsPromises.readdir(backupFolderPath);
        files = files.filter(value => value.startsWith('telemetry_'))

        if (files.length > 0) {
            console.log('Started processing backups, number of backup files: ', files.length);
            for (const file of files) {
                try {
                    const filePath = path.join(backupFolderPath, file);
                    const fileName = file.replace(/\.zip$/, '');

                    const zipBuffer = await fsPromises.readFile(filePath);
                    const extractedData = await unzipper.Open.buffer(zipBuffer)
                        .then(zip => zip.extract({ path: 'extracted_data' }))
                        .then(() => fsPromises.readFile(`extracted_data/${fileName}.json`, 'utf8'))
                        .then(JSON.parse);

                    const dataType = extractedData.type;
                    const telemetryConfig = this.config.telemetry[dataType];
                    if (telemetryConfig.url !== '') {
                        await this.pushToTelemetryServer(dataType, extractedData.payload);

                        fsPromises.access(filePath)
                            .then(() => fsPromises.unlink(filePath))
                            .catch(() => console.log(`File does not exist ${filePath}`))

                        fsPromises.access(`extracted_data/${fileName}.json`)
                            .then(() => fsPromises.rm(`extracted_data/${fileName}.json`, { recursive: true }))
                            .catch(() => () => console.log(`File does not exist ${filePath}`));

                        console.log(`Backup data from ${file} successfully pushed to ${dataType} server!!!`);
                    }

                } catch (error) {
                    console.error(`Error while pushing backup data to server :: file: ${file} :: error: `, error);
                }

            }
        }
    }

    getDataType(eventType) {
        switch (eventType) {
            case 'api':
                return 'network';
            case 'raw':
                return 'raw';
            default:
                console.error('Invalid event type: ', eventType);
        }
    }

    async pushToTelemetryServer(dataType, payload) {
        await axios.post(this.config.telemetry[dataType].url, {
            data: {
                id: generateCheckSum(payload),
                events: payload,
            },
        });
    }

}