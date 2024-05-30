import { Request, Response } from 'express'
import { AdditionalData, DataPoint, IAudit, IMetric, ITrace } from '../../@types';
import _ from 'lodash';
import { transformAttributes, generateMd5Hash, currentTimeNano, prefixWith } from '../utils/common';
import { getEventMetadata, getRequestAttributes, getStatus } from '../utils/api'
import { v4 } from 'uuid';

export const generateTraceEvent = (request: Request, response: Response) => {
    const ctx = _.get(request, 'telemetryMetadata.ctx') || {};
    const reqObjNotPresent = _.get(request, 'telemetryMetadata.reqObjNotPresent', false);
    const globalConfig = _.get(request, 'telemetryMetadata.globalConfig');
    const { scope = {}, data = {} } = ctx;
    const body = reqObjNotPresent ? request : _.get(request, 'body', {});
    const { attributes: spanAdditionalAttributes = {}, events = [] } = data;
    const { attributes = {} } = scope || {};
    const resourceAttributes = getGlobalResourceAttributes({ eid: "API", domain: _.get(body, 'context.domain') }, globalConfig);
    const isPrefixedWithOn = body?.context?.action?.includes("on_") || false;

    const spanAttributes = {
        "sender.id": isPrefixedWithOn ? _.get(body, 'context.bpp_id', '') : _.get(body, 'context.bap_id', ''),
        "sender.type": isPrefixedWithOn ? "provider" : "seeker",
        "recipient.id": isPrefixedWithOn ? _.get(body, 'context.bap_id', '') : _.get(body, 'context.bpp_id', ''),
        "sender.uri": isPrefixedWithOn ? _.get(body, 'context.bpp_uri', '') : _.get(body, 'context.bap_uri', ''),
        "recipient.type": isPrefixedWithOn ? "seeker" : "provider",
        "recipient.uri": isPrefixedWithOn ? _.get(body, 'context.bap_uri', '') : _.get(body, 'context.bpp_uri', ''),
        "span_uuid": generateMd5Hash({ ets: currentTimeNano(), pid: isPrefixedWithOn ? _.get(body, 'context.bpp_id', '') : _.get(body, 'context.bap_id', ''), messageId: _.get(body, 'context.message_id', ''), transactionId: _.get(body, 'context.transaction_id', '') }),
        ...getRequestAttributes(request, response, reqObjNotPresent),
        ...spanAdditionalAttributes
    };

    const httpEvents = getEventMetadata(request, response, reqObjNotPresent);
    const spanEvents = _.map([...httpEvents, ...events], transformEvent);

    const spans = [
        {
            "name": _.get(body, 'context.action', ''),
            "traceId": _.get(body, 'context.transaction_id', ''),
            "spanId": _.get(body, 'context.message_id', ''),
            "startTimeUnixNano": _.get(request, 'telemetryMetadata.startTimeUnixNano', currentTimeNano()),
            "endTimeUnixNano": currentTimeNano(),
            "status": getStatus(response.statusCode),
            "attributes": transformAttributes(spanAttributes),
            "events": spanEvents
        }
    ];

    const scopeAttributes = { ...attributes, scope_uuid: generateMd5Hash({ spans, pid: _.get(globalConfig, 'participantId', '') }), count: 1 };
    const scopeCtx = { name: _.get(globalConfig, 'service.name', null), version: _.get(globalConfig, 'service.version', null), attributes: transformAttributes(scopeAttributes) };

    return {
        "resourceSpans": [
            {
                "resource": {
                    "attributes": transformAttributes(resourceAttributes)
                },
                "scopeSpans": [
                    {
                        scope: scopeCtx,
                        spans
                    }
                ]
            }
        ]
    }
}

export const generateAuditEvent = (ctx: IAudit[], globalConfig: Record<string, any>, additionalData: AdditionalData) => {
    const { domain, attributes = {} } = additionalData;
    const resourceAttributes = getGlobalResourceAttributes({ eid: "AUDIT", domain }, globalConfig);
    const logRecords = _.map(ctx, transformAudit);
    const scopeAttributes = { scope_uuid: generateMd5Hash({ logRecords, pid: _.get(globalConfig, 'participantId', '') }), count: _.size(logRecords), ...attributes };
    const scopeCtx = { name: _.get(globalConfig, 'service.name', null), version: _.get(globalConfig, 'service.version', null), attributes: transformAttributes(scopeAttributes) };

    return {
        "resourceLogs": [
            {
                "resource": {
                    "attributes": transformAttributes(resourceAttributes)
                },
                "scopeLogs": [
                    {
                        scope: scopeCtx,
                        logRecords
                    }
                ]
            }
        ]
    }
}

export const generateMetricEvent = (ctx: IMetric[], globalConfig: Record<string, any>, additionalData: AdditionalData) => {
    const { domain, attributes = {} } = additionalData;
    const resourceAttributes = getGlobalResourceAttributes({ eid: "METRIC", domain }, globalConfig);
    const metrics = _.map(ctx, transformMetric);
    const scopeAttributes = { scope_uuid: generateMd5Hash({ metrics, pid: _.get(globalConfig, 'participantId', '') }), count: _.size(metrics), ...attributes };
    const scopeCtx = { name: _.get(globalConfig, 'service.name', null), version: _.get(globalConfig, 'service.version', null), attributes: transformAttributes(scopeAttributes) };

    return {
        "resourceMetrics": [
            {
                "resource": {
                    "attributes": transformAttributes(resourceAttributes)
                },
                "scopeMetrics": [
                    {
                        scope: scopeCtx,
                        metrics
                    }
                ]
            }
        ]
    }
}

export const generateRawEvent = (request: Record<string, any>, response: Record<string, any>) => {
    request.response = response;
    return _.omit(request, ['telemetryMetadata']);
}

const getGlobalResourceAttributes = (payload: Record<string, any>, globalConfig: Record<string, any>) => {
    const { eid, domain } = payload;
    return {
        eid,
        producer: _.get(globalConfig, 'participantId', ''),
        ...(domain && { domain }),
        ..._.get(globalConfig, 'resource.attributes', {})
    }
}

const transformDataPoint = (dataPoint: DataPoint) => {
    const { end, metric = {}, start, value, attributes = {} } = dataPoint;
    return {
        asDouble: value,
        startTimeUnixNano: start,
        endTimeUnixNano: end,
        attributes: transformAttributes({
            observedTimeUnixNano: currentTimeNano(),
            metric_uuid: v4(),
            ...prefixWith(metric, "metric"),
            ...attributes
        })
    }
}

const transformMetric = (payload: IMetric) => {
    const { key, metric, unit, description = "" } = payload;
    const { aggregationTemporality, isMonotonic = false, type = "sum", dataPoints = [] } = metric;
    return {
        name: key,
        unit,
        description,
        [type]: {
            aggregationTemporality,
            isMonotonic,
            dataPoints: _.map(dataPoints, transformDataPoint)
        }
    }
}

const transformEvent = (event: Record<string, any>) => {
    const { attributes = {} } = event;
    return {
        ...event,
        attributes: transformAttributes(attributes)
    }
}

const transformAudit = (payload: IAudit) => {
    const { timestamp = currentTimeNano(), message, object = {}, attributes = {}, severityNumber = 1, traceId = v4() } = payload;
    return {
        timeUnixNano: currentTimeNano(),
        observedTimeUnixNano: timestamp,
        severityNumber,
        traceId,
        spanId: v4(),
        body: { stringValue: message },
        attributes: transformAttributes({ log_uuid: v4(), ...object, ...attributes })
    }
}