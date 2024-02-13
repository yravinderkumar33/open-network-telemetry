import { Telemetry } from "./Telemetry.js";


export const telemetryMiddleware = (inputConfig) => {

    Telemetry.init(inputConfig);

    const generate = async (req, res, next) => {
        res.body.statusCode = res?.statusCode;
        Telemetry.generate(req.body, res.body);
        next();
    };

    return generate;
};