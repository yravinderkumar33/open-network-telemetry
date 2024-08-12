const winston = require('winston');
require('winston-daily-rotate-file');

import _ from 'lodash';

export interface ILog {
    level: string
    message: any
    [key: string]: any
}

const eventsLogger = (config: Record<string, any>) => {

    const defaultOptionsForDailyRotateFile = {
        level: 'info',
        filename: 'telemetry-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '5k',
        maxFiles: '7d',
        dirname: "logs"
    }

    const dailyRotateFileTransport = new winston.transports.DailyRotateFile({
        ...defaultOptionsForDailyRotateFile,
        ..._.get(config, 'loggerOptions', {})
    });

    const loggerOptions = {
        level: 'info',
        defaultMeta: { service: _.get(config, 'participantId', 'sahamati-proxy') },
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        ),
        transports: [
            new winston.transports.Console(),
            dailyRotateFileTransport
        ]
    }

    const winstonLogger = winston.createLogger(loggerOptions);
    const logger = (payload: ILog) => winstonLogger.log(payload)
    return logger;
}

export default eventsLogger