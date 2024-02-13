import { Telemetry } from "./Telemetry.js";


export const telemetryMiddleware = (inputConfig) => {

    let initialized = false;

    const init = () => {
        try {
            if (initialized) {
                console.log('Telemetry middleware is already initialized.');
                return;
            }

            Telemetry.init(inputConfig);
            initialized = true;
        } catch (error) {
            console.error(error);
        }
    };

    const generate = async (req, res, next) => {
        Telemetry.generate(req.body, res.body);
        next();
    };

    init();

    return generate;
};


