import { validateData } from "../utils/common";
import schema from '../schemas/config-schema.json'

export const validateConfig = (config: Record<string, any>) => {
    const { isValid, validate } = validateData(schema, config);

    if (!isValid) {
        throw new Error("Configuration Object is invalid " + JSON.stringify(validate.errors, null, 2));
    }

    return config;
}