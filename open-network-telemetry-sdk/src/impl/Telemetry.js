import TelemetryConfig from "../config/TelemetryConfig.js";
import { TelemetryDispatcher } from "../helpers/TelemetryDispatcher.js";


export class Telemetry {
    static config = {};
    static dispatcher;

    static init(inputConfig) {
        try {
            Telemetry.config = new TelemetryConfig(inputConfig);
            console.log('Telemetry initialized successfully');

            if (!Telemetry.dispatcher) {
                Telemetry.dispatcher = new TelemetryDispatcher(Telemetry.config);
                setInterval(() => {
                    Telemetry.dispatcher.syncTelemetry(true)
                }, Telemetry.config.telemetry.syncInterval * 1000);
            }
        } catch (error) {
            console.log(error);
        }
    }

    static async generate(request, response) {
        if (!Telemetry.dispatcher) {
            console.error('Dispatcher not initialized. Call Telemetry.init() first.');
            return;
        }
        await Telemetry.dispatcher.processTelemetry(request, response, 'api');
        await Telemetry.dispatcher.processTelemetry(request, response, 'raw');
    }
}
