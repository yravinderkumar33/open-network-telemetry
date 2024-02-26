import Ajv from "ajv";
import _ from 'lodash';
import crypto from "crypto";
const nanoTime = require('nano-time');

const dataTypeMapping = {
    'string': 'stringValue',
    'boolean': 'boolValue',
    'array': 'arrayValue',
    'object': 'kvlistValue',
    'double': 'doubleValue',
    'int': 'intValue'
}

export const transformAttributes = (ctx: Record<string, any>) => {

    const handleArrayType = (payload: Record<string, any>[]) => {
        return _.map(payload, (value: any) => {
            const dataType = getDataType(value);
            const mappedDataType = _.get(dataTypeMapping, dataType);
            return {
                [mappedDataType]: value
            }
        })
    }

    const handleObjectType = (payload: Record<string, any>) => {
        return _.map(payload, (value: any, key: string) => {
            const dataType = getDataType(value);
            const mappedDataType = _.get(dataTypeMapping, dataType);
            return {
                "key": key,
                "value": {
                    [mappedDataType]: value
                }
            }
        })
    }

    const handleNonPrimitiveTypes = (type: string, value: any) => {
        let values: any = [];
        switch (type) {
            case 'object': {
                values = handleObjectType(value);
                break;
            }
            case 'array': {
                values = handleArrayType(value);
                break;
            }
            default: {
                values = [];
            }
        }
        return { values }
    }

    return _.reduce(ctx, (prev: Record<string, any>[], current: Record<string, any>, key: string) => {
        let value = current;
        const dataType = getDataType(value);
        const mappedDataType = _.get(dataTypeMapping, dataType);
        if (!mappedDataType) return prev;

        if (['object', 'array'].includes(dataType)) {
            value = handleNonPrimitiveTypes(dataType, value);
        }

        prev = [...prev, { key, value: { [mappedDataType]: value } }];
        return prev;
    }, [])
}

const getDataType = (variable: any) => {
    let dataType: string = typeof variable;
    if (dataType === 'number') {
        return dataType.toString().includes('.') ? 'double' : 'int'
    } else if (dataType === 'object') {
        return Array.isArray(variable) ? 'array' : 'object';
    }
    return dataType;
}

export const validateData = (schema: Record<string, any>, data: any) => {
    const ajv = new Ajv();
    const validate = ajv.compile(schema);
    const isValid = validate(data);
    return {
        isValid,
        validate
    }
}

export function generateMd5Hash(data: Record<string, any> | Record<string, any>[]) {
    const jsonString = JSON.stringify(data);
    const checksum = crypto.createHash('md5').update(jsonString).digest('hex');
    return checksum;
}

export const currentTimeNano = () => {
    return nanoTime();
}