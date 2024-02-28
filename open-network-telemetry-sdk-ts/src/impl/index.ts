import { NextFunction, Request, Response } from 'express';
import { validateConfig } from '../config';
import telemetryDispatcher from '../helpers/telemetryDispatcher';
import { generateAuditEvent, generateMetricEvent, generateRawEvent, generateTraceEvent } from '../helpers/eventGenerator';
import { AdditionalData, IAudit, IMetric, ITrace } from '../../@types';
import _ from 'lodash';
import { currentTimeNano } from '../utils/common';

let globalConfig: Record<string, any> = {};
let dispatcher: any;

export const init = (config: Record<string, any>) => (request: Request, response: Response, next: NextFunction) => {
    globalConfig = validateConfig(config);
    initializeDispatcher(globalConfig);
    request.telemetryMetadata = { startTimeUnixNano: currentTimeNano(), globalConfig, ctx: {} };
    interceptResponse(response);
    next();
}

export const onApi = (ctx: ITrace) => (request: Request | Record<string, any>, response: Response | Record<string, any>, next?: NextFunction) => {
    checkIfInitialized();
    if (next) {
        registerInterceptor(request as Request, response as Response);
        request.telemetryMetadata.ctx = ctx;
        next();
    } else {
        generate(request, response, ctx);
    }
}

export const onCallback = (ctx: ITrace) => (request: Request | Record<string, any>, response: Response | Record<string, any>, next?: NextFunction) => {
    checkIfInitialized();
    if (next) {
        registerInterceptor(request as Request, response as Response);
        request.telemetryMetadata.ctx = ctx;
        next();
    } else {
        generate(request, response, ctx);
    }
}

export const generate = (request: Record<string, any>, response: Record<string, any>, ctx: ITrace = {}) => {
    request.telemetryMetadata = { startTimeUnixNano: currentTimeNano(), globalConfig, ctx: ctx || {}, reqObjNotPresent: true };
    const event = generateTraceEvent(request as any, response as any);
    dispatcher.processTelemetry(event, "api");
    const rawEvent = generateRawEvent(request, response);
    dispatcher.processTelemetry(rawEvent, "raw");
}

export const onMetric = (ctx: IMetric | IMetric[], additionalData: AdditionalData = {}) => {
    checkIfInitialized();
    const event = generateMetricEvent(Array.isArray(ctx) ? ctx : [ctx], globalConfig, additionalData);
    dispatcher.processTelemetry(event, "metric");
}

export const onAudit = (ctx: IAudit | IAudit[], additionalData: AdditionalData = {}) => {
    checkIfInitialized();
    const event = generateAuditEvent(Array.isArray(ctx) ? ctx : [ctx], globalConfig, additionalData);
    dispatcher.processTelemetry(event, "audit");
}

const initializeDispatcher = (config: Record<string, any>) => {
    if (!dispatcher) {
        dispatcher = telemetryDispatcher(config);
        setInterval(() => { dispatcher.syncTelemetry() }, config?.telemetry?.syncInterval * 60 * 1000);
    }
}

const checkIfInitialized = () => {
    if (!dispatcher) {
        throw new Error("SDK is not initialized")
    }
}

const interceptResponse = (response: Response) => {
    const oldSendRef = response.send
    response.send = function (data) {
        try {
            response.locals.responseBody = typeof data == 'string' ? JSON.parse(data) : data;
        } catch (error) {
            response.locals.responseBody = data
        }
        response.send = oldSendRef
        return response.send(data)
    }
}

const registerInterceptor = (request: Request, response: Response) => {
    response.on('finish', () => {
        if (dispatcher && response.statusCode != 404) {
            const event = generateTraceEvent(request, response);
            dispatcher.processTelemetry(event, "api");
            const rawEvent = generateRawEvent(_.get(request, 'body', {}), _.get(response, 'locals.responseBody', {}))
            dispatcher.processTelemetry(rawEvent, "raw");
        }
    })
}
