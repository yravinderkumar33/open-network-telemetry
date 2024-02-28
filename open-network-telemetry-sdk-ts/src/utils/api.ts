import { Request, Response } from 'express';
import _ from 'lodash';
import { currentTimeNano } from './common';

export const getRequestAttributes = (req: Request, res: Response, reqObjNotPresent = false) => {
    const { url, method, hostname, protocol } = req;
    const body = reqObjNotPresent ? req : _.get(req, 'body', {});
    return {
        "observedTimeUnixNano": _.get(body, 'context.timestamp', currentTimeNano()),
        ...(!reqObjNotPresent && {
            "http.method": method,
            "http.route": url,
            "http.host": hostname,
            "http.user_agent": req.get("User Agent"),
            "http.scheme": protocol,
            "http.status.code": res.statusCode || res.status
        })
    }
}

export const getEventMetadata = (request: Request, response: Response, reqObjNotPresent: boolean) => {
    const requestBody = reqObjNotPresent ? request : _.get(request, 'body', {});
    const responseBody = reqObjNotPresent ? _.get(response, 'data', response) : _.get(response, 'locals.responseBody');
    const statusCode = reqObjNotPresent ? _.get(response, 'status') : _.get(response, 'statusCode')
    const isError = reqObjNotPresent ? false : getStatus(statusCode) === "Error";

    return [
        {
            name: 'request_info',
            time: new Date().toISOString(),
            attributes: {
                "reqBody": JSON.stringify(_.omit(requestBody, 'message'))
            }
        },
        ...(!isError ? [
            {
                name: 'response_info',
                time: new Date().toISOString(),
                attributes: {
                    "resBody": typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody)
                }
            }
        ] : [
            {
                name: 'error',
                time: new Date().toISOString(),
                attributes: {
                    "type": _.get(responseBody, 'error.type', ''),
                    "msg": _.get(responseBody, 'error.message', ''),
                    "code": _.get(responseBody, 'error.code', '')
                }
            }
        ])
    ]
}

export const getStatus = (statusCode: any) => {
    if (statusCode >= 200 && statusCode < 300) return "Ok"
    return "Error"
}