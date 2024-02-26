import { Request } from 'express';
import redisHelper from '../utils/redis';
import _ from 'lodash';
import { promises as fsPromises } from 'fs';
import fs from 'fs';
import path from "path";
import unzipper from "unzipper";
import archiver from "archiver";
import axios from 'axios';
import { generateMd5Hash } from '../utils/common';

export default (config: Record<string, any>) => {

    const urls = {
        api: config?.telemetry?.network?.url,
        metric: config?.telemetry?.network?.url,
        audit: config?.telemetry?.network?.url,
        raw: config?.telemetry?.raw?.url,
    }

    const localStorage: Record<string, any> = {};
    const redisClient = (_.toLower(_.get(config, 'telemetry.storageType', '')) === 'redis') && redisHelper(config);
    let isSyncing = false;
    const backupFolderPath = config?.telemetry?.backupFilePath || 'backups';

    const processTelemetry = async (event: Record<string, any>, eventType: string) => {
        if (eventType in urls) {
            try {
                console.log(JSON.stringify(event))
                await storeData(event, eventType);
                const dataSize = await getDataSize(eventType);
                if (dataSize >= config.telemetry.batchSize) {
                    await syncTelemetry();
                }
            } catch (error: any) {
                console.log("Error while generating event", error?.message);
            }
        }
    }

    const storeData = async (event: Record<string, any>, eventType: string) => {
        if (redisClient) {
            await redisClient.pushList(eventType, JSON.stringify(event))
        } else {
            if (!localStorage[eventType]) {
                localStorage[eventType] = [];
            }
            localStorage[eventType].push(event);
        }
    }

    const getDataSize = async (eventType: string) => {
        if (redisClient) {
            return redisClient.getListLength(eventType)
        } else {
            return _.size(_.get(localStorage, eventType, []));
        }
    }

    const getData = async (eventType: string) => {
        if (redisClient) {
            const data = await redisClient.getList(eventType);
            if (_.size(data) === 0) return [];
            return _.map(data, JSON.parse);
        } else {
            return _.get(localStorage, eventType, []);
        }
    }

    const flushData = async (eventType: string) => {
        if (redisClient) {
            await redisClient.delKey(eventType);
        } else {
            localStorage[eventType] = [];
        }
        console.log('Data is flushed successfully')
    }

    const syncTelemetry = async () => {
        if (!isSyncing) {
            isSyncing = true
            console.log("Started syncing telemetry...");
            for (const dataType of Object.keys(urls)) {
                const dataSize = await getDataSize(dataType);
                console.log(`Stored ${dataType} data size: ${dataSize}`);
                if (dataSize === 0) continue;
                try {
                    const events = await getData(dataType)
                    await pushToTelemetryServer(dataType, events);
                    console.log(`${dataType} data is successfully pushed to server!!!`);
                    await flushData(dataType);
                    await processBackupFiles();
                } catch (error) {
                    console.error(`Error while pushing ${dataType} data to server: `, _.get(error, 'message', ''));
                    if (config.telemetry.storageType.toLowerCase() === 'local') {
                        const events = await getData(dataType)
                        createBackup(dataType, events);
                    }
                } finally {
                    localStorage[dataType] = [];
                }
            }
            isSyncing = false
        }
    }

    const processBackupFiles = async () => {
        await fsPromises.access(backupFolderPath).then(() => true).catch(() => fsPromises.mkdir(backupFolderPath, { recursive: true }));
        let files = await fsPromises.readdir(backupFolderPath);
        files = files.filter(value => value.startsWith('telemetry_'));
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
                    const telemetryServerUrl = _.get(urls, dataType);
                    if (telemetryServerUrl) {
                        await pushToTelemetryServer(dataType, extractedData.payload);
                        fsPromises.access(filePath).then(() => fsPromises.unlink(filePath)).catch(() => console.log(`File does not exist ${filePath}`))
                        fsPromises.access(`extracted_data/${fileName}.json`).then(() => fsPromises.rm(`extracted_data/${fileName}.json`, { recursive: true })).catch(() => () => console.log(`File does not exist ${filePath}`));
                        console.log(`Backup data from ${file} successfully pushed to ${dataType} server!!!`);
                    }
                } catch (error) {
                    console.error(`Error while pushing backup data to server :: file: ${file} :: error: `, error);
                }
            }
        }
    }

    const pushToTelemetryServer = async (dataType: string, events: Record<string, any>[]) => {
        const url = _.get(urls, dataType);
        if (!url) return;
        return axios.post(url, {
            data: {
                id: generateMd5Hash(events),
                events,
            }
        });
    }

    const createBackup = async (dataType: string, payload: any) => {
        await fsPromises.access(backupFolderPath).then(() => true).catch(() => fsPromises.mkdir(backupFolderPath, { recursive: true }));
        const fileName = `telemetry_${dataType}_data_${Date.now()}`;
        const zipFileName = `telemetry_${dataType}_data_${Date.now()}.zip`;
        const zipStream = fs.createWriteStream(`${backupFolderPath}/${zipFileName}`);
        const archive = archiver('zip');
        archive.pipe(zipStream);
        archive.append(JSON.stringify({ type: dataType, payload }), { name: `${fileName}.json` });
        archive.finalize();
        console.log(`Data stored locally in file: ${zipFileName}`);
    }

    return {
        processTelemetry,
        syncTelemetry
    }
}