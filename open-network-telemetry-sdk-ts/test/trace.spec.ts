import express, { Request, Response } from 'express';
import Telemetry from '../src';

var app = express();

app.use(
    express.json({
        verify: (req: Request, res: Response, buf: Buffer) => {
            res.locals = {
                rawBody: buf.toString(),
            }
        },
        limit: "200kb",
    })
);

let config = {
    "participantId": "sahamati-proxy",
    "participantType": "Proxy",
    "participantUri": "http://le-ps-bap-network.onest.network",
    "role": "BAP",
    "telemetry": {
        "batchSize": 100,
        "syncInterval": 1,
        "retry": 3,
        "storageType": "LOCAL",
        "backupFilePath": "backups",
        "redis": {
            "host": "localhost",
            "port": 6379,
            "db": 4
        },
        "network": {
            "url": "https://webhook.site/9823f7cf-5a6c-44bb-9b23-7d09701e6e86"
        },
        "raw": {
            "url": "https://webhook.site/9823f7cf-5a6c-44bb-9b23-7d09701e6e86"
        }
    },
    "service": {
        "name": "discovery_service",
        "version": "1.0.0"
    },
    "resource": {
        "attributes": {

        }
    }
}

app.use(Telemetry.init(config));

const data = {
    "scope": {
        "name": "Account Discovery",
        "attributes": {}
    },
    "data": {
        "attributes": {"sender.id": "AA1", "recipient.id": "FIP1", "recipient.uri": "https://FIP1-uat.onemoney.in/Accounts/discover"},
        "events": []
    }
}

app.post('/search', Telemetry.onApi(data), function (req, res) {
    const logEvents = [
        {
            "traceId": "123",
            "timestamp": Date.now(),
            "severityNumber": "5",
            "message": "User 'obsrv' successfully initiated order for book 'BOOK_001' from IP address 192.168.1.100.",
            "object": {
                "id": "123-456-789",
                "type": "BOOK",
                "name": "BOOK_001",
                "code": "101",
                "prevstate": "init",
                "state": "completed",
                "duration": "10"
            }
        },
        {
            "traceId": "456",
            "timestamp": Date.now(),
            "severityNumber": "1",
            "message": "User 'obsrv' successfully placed order for book 'BOOK_001' from IP address 192.168.1.100.",
            "object": {
                "id": "123-456-789",
                "type": "BOOK",
                "name": "BOOK_001",
                "code": "101",
                "prevstate": "init",
                "state": "completed",
                "duration": "10"
            },
            "attributes": {
                "author": "obsrv",
                "addlData.initdate": "2024-01-01T00:00:00.000+05:30",
                "addlData.paymentRefNumber": "b2aa-325096b39f47"
            }
        }
    ]

    Telemetry.onAudit(logEvents, { domain: "onest:learning-experiences" });

    const responseData = {
        "message": {
            "ack": {
                "status": "ACK"
            }
        }
    }

    res.status(200).json(responseData);
})

app.post('/on_search', Telemetry.onApi(data), function (req, res) {

    const metric = {
        "key": "search_api_total_count",
        "unit": "1",
        "description": "Total number of search API Calls",
        "metric": {
            "type": "sum",
            "aggregationTemporality": 1,
            "isMonotonic": false,
            "dataPoints": [
                {
                    "value": 15699,
                    "start": "1544712660000000000",
                    "end": "1544712660000000000",
                    "metric": {
                        "code": "search_api_total_count",
                        "category": "Discovery",
                        "label": "Discovery total calls",
                        "granularity": "day",
                        "frequency": "day",
                    },
                    "attributes": {
                        "add1": "value"
                    }
                }
            ]
        }
    }

    Telemetry.onMetric(metric, { "domain": "onest:learning-experiences", "attributes": { "scopeAttr": "test" } });

    const responseData = { "message": { "ack": { "status": "ACK" } } };

    res.json(responseData);
})

app.post('/init', function (req, res) {

    custom();

    const responseData = {
        message: 'Telemetry data generated successfully',
        data: {
            // Your telemetry data here
        }
    };

    res.json(responseData);
})


const custom = () => {
    let request = {
        "context": {
            "domain": "onest:learning-experiences",
            "action": "select",
            "version": "1.1.0",
            "bap_id": "le-ps-bap-network.onest.network",
            "bap_uri": "https://le-ps-bap-network.onest.network",
            "bpp_id": "le-ps-bpp-network.onest.network",
            "bpp_uri": "https://le-ps-bpp-network.onest.network",
            "transaction_id": "a9aaecca-10b7-4d19-b640-b047a7c62196",
            "message_id": "0d30bfbf-87b8-43d2-8f95-36ebb9a24fd6",
            "ttl": "PT10M",
            "timestamp": "2023-02-15T15:14:30.560Z"
        },
        "message": {}
    }

    let response = {
        "statuscode": "200",
        "duration": 350,
        "message": {
            "ack": {
                "status": "ACK"
            }
        }
    }

    Telemetry.onApi({})(request, response);
}

var server = app.listen(8081, () => {
    console.log("server is running on port ", 8081)
})