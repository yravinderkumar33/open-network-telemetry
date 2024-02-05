import { RedisClient } from "../utils/RedisUtil.js";
import axios from "axios";
import { createTelemetryEvent } from "./EventGenerator.js";
import archiver from "archiver";
import { promises as fsPromises } from 'fs';
import fs from 'fs';
import path from "path";
import unzipper from "unzipper";
import { v1 } from "uuid";
import axiosRetry from "axios-retry";



export class TelemetryDispatcher {
    constructor(config) {
        this.config = config;
        this.localStorage = {};
        this.redisClient = null;
        this.rawLastSyncTime = Date.now();
        this.networkLastSyncTime = Date.now();

        if (config.telemetry.storageType.toLowerCase() === 'redis') {
            this.redisClient = new RedisClient(config);
        }
        axiosRetry(axios, { retries: this.config.telemetry.retry, retryDelay: axiosRetry.exponentialDelay });
    }

    async storeData(event, eventType) {
        if (this.redisClient) {
            this.redisClient.pushList(eventType, JSON.stringify(event));
        } else {
            if (!this.localStorage[eventType]) {
                this.localStorage[eventType] = [];
            }
            this.localStorage[eventType].push(event);
        }
    }

    async getDataSize(eventType) {
        if (this.redisClient) {
            return await this.redisClient.getListLength(eventType);
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

    flushData(eventType) {
        if (this.redisClient) {
            this.redisClient.delKey(eventType);
        } else {
            this.localStorage[eventType] = [];
        }
    }

    async processTelemetry(request, response, eventType) {
        const dataType = this.getDataType(eventType);
        if (this.config.telemetry[dataType].url !== '') {
            const event = createTelemetryEvent(request, response, eventType, this.config);

            await this.storeData(event, `${dataType}-event`);
            console.log(`${dataType} event generated`);

            const dataSize = await this.getDataSize(`${dataType}-event`);
            console.log(`Stored ${dataType} data size: `, dataSize);

            if (Date.now() - this[`${dataType}LastSyncTime`] > this.config.telemetry.syncInterval * 60 * 1000 || dataSize >= this.config.telemetry.batchSize) {
                try {
                    const payload = Object.values(await this.getData(`${dataType}-event`)).flat();
                    this.pushToTelemetryServer(dataType, payload);
                    this.flushData(`${dataType}-event`);
                    this[`${dataType}LastSyncTime`] = Date.now();
                    await this.processBackupFiles()
                } catch (error) {
                    console.error(`Error while pushing ${dataType} data to server: `, error);
                    if (this.config.telemetry.storageType.toLowerCase() === 'local') {
                        this.createBackup(dataType, Object.values(await this.getData(`${dataType}-event`)).flat());
                    }
                } finally {
                    this.localStorage[eventType] = [];
                }
            }
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
                        this.pushToTelemetryServer(dataType, extractedData.payload);

                        fsPromises.access(filePath)
                            .then(() => fsPromises.unlink(filePath))
                            .catch(() => console.log(`File does not exist ${filePath}`))

                        fsPromises.access(`extracted_data/${fileName}.json`)
                            .then(() => fsPromises.rm(`extracted_data/${fileName}.json`, { recursive: true }))
                            .catch(() => () => console.log(`File does not exist ${filePath}`));

                        console.log(`Backup data from ${file} successfully pushed to ${dataType} server!!!`);
                    }

                } catch (error) {
                    console.error(`Error while processing file ${file}: `, error);
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

    async pushToTelemetryServer(dataType, payload){
        try {
            await axios.post(this.config.telemetry[dataType].url, {
                data: {
                    id: v1(),
                    events: payload,
                },
            });
            console.log(`${dataType} data is successfully pushed to server!!!`);
        } catch (error) {
            throw new Error(`Error while sending ${dataType} data to server: ${error.message}`);
        }
    }
}