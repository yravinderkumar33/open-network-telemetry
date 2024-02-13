import crypto from "crypto";


export function createTelemetryEvent(request, response, eventType, config){
    if (eventType === 'api') {
        return createAPIEvent(request, response, config);
    } else if (eventType === 'raw') {
        return createRawDataEvent(request, response);
    }
}

function createAPIEvent(request, response, config) {
    let event = {};

    event.eid = "API";
    event.ets = Date.now();
    event.ver = "1.0";

    event.context = {
        domain: request?.context?.domain,

        producer: {
            id: config.participantId,
            uri: config.participantUri
        }
    };

    event.data = {
        url: `/${request?.context?.action}`,
        method: "POST",
        action: request?.context?.action,
        transactionid: request?.context?.transaction_id,
        msgid: request?.context?.message_id,
        source: {
            id: request?.context?.action?.includes("on_") ? request?.context?.bpp_id : request?.context?.bap_id,
            type: request?.context?.action?.includes("on_") ? "provider" : "seeker",
            uri: request?.context?.action?.includes("on_") ? request?.context?.bpp_uri : request?.context?.bap_uri
        },
        target: {
            id: request?.context?.action?.includes("on_") ? request?.context?.bap_id : request?.context?.bpp_id,
            type: request?.context?.action?.includes("on_") ? "seeker" : "provider",
            uri: request?.context?.action?.includes("on_") ? request?.context?.bap_uri : request?.context?.bpp_uri
        }
    };

    if (response?.hasOwnProperty('statuscode')) event.data.statuscode = response.statuscode;
    if (response?.hasOwnProperty('duration')) event.data.duration = response.duration;
    if (response?.hasOwnProperty('error')) event.data.error = response.error;

    event.mid = generateCheckSum(event);

    return event;
}

function createRawDataEvent(request, response) {
    request.response = response;
    return request;
}

export function generateCheckSum(data) {
    const jsonString = JSON.stringify(data);
    const checksum = crypto.createHash('md5').update(jsonString).digest('hex');
    return checksum;
}