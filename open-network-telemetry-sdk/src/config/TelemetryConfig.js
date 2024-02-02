import Ajv from "ajv";
import fs from "fs";
import path from "path";

class TelemetryConfig {
    constructor(config) {

        const configSchema = JSON.parse(fs.readFileSync(path.resolve("./schemas", 'config-schema.json'), 'utf8'));
        validateConfig(configSchema, config);

        this.participantId = config.participantId;
        this.participantUri = config.participantUri;
        this.domain = config.domain;
        this.role = config.role;

        this.telemetry = {
            batchSize: config.telemetry.batchSize,
            syncInterval: config.telemetry.syncInterval,
            retry: config.telemetry.retry,
            storageType: config.telemetry.storageType,
            backupFilePath: config.telemetry.backupFilePath,
            redis: {
                host: config.telemetry.redis.host,
                port: config.telemetry.redis.port,
                db: config.telemetry.redis.db,
            },
            network: {
                url: config.telemetry.network.url,
            },
            raw: {
                url: config.telemetry.raw.url,
            },
        };
    }
}

function validateConfig(configSchema, inputConfig) {
    const ajv = new Ajv();
    const validate = ajv.compile(configSchema);
    const valid = validate(inputConfig);

    if (!valid) {
        throw new Error("Configuration Object is invalid " + JSON.stringify(validate.errors, null, 2));
    } else {
        console.log("Configuration object is valid");
    }
}

export default TelemetryConfig;