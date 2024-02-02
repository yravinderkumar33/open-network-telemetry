import TelemetryConfig from "../config/TelemetryConfig.js";
import { TelemetryDispatcher } from "../helpers/TelemetryDispatcher.js";


class Telemetry {

    constructor() {
        this.config = {};
    }

    init(inputConfig) {
        try {
            this.config = new TelemetryConfig(inputConfig);
            console.log('Telemetry initialized successfully');
        } catch (error) {
            console.log(error)
        }
    }

    async generate(request, response) {
        const dispatcher = new TelemetryDispatcher(this.config);

        //api event
        await dispatcher.processTelemetry(request, response, 'api');

        //raw event
        await dispatcher.processTelemetry(request, response, 'raw');
    }
}

export default Telemetry;