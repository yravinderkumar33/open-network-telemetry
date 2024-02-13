# Telemetry SDK

Telemetry SDK will help to generate the different telemetry events. These events sync to the server in a batch or in periodic intervals as defined in the configuration.

### Configuration:

Following are the details about configuration properties. To generate telemetry events, the user has to call the init method by passing the configuration.


| Property                       | Description                                                      | Required | Default Value |
|--------------------------------|------------------------------------------------------------------|----------|---------------|
| participantId                  | Identifier for the participant                                  | Yes      | -             |
| participantUri                 | URI for the participant                                          | Yes      | -             |
| role                           | Role of the participant                                          | Yes      | -             |
| batchSize            | Number of telemetry events per batch                             | Yes      | 100           |
| syncInterval         | Time interval(in minutes) for telemetry synchronization                    | Yes      | 5             |
| retry                | Number of retry attempts in case of failure                      | Yes      | 3             |
| storageType          | Type of storage for telemetry data. Allowed values are LOCAL and REDIS. | Yes      | LOCAL     |
| backupFilePath                 | Path for storing backup telemetry data                           | Yes      | backups       |
| redis.host                     | Hostname or IP address of the Redis server                       | If storageType is REDIS | localhost |
| redis.port                     | Port number for the Redis server                                 | If storageType is REDIS | 6379        |
| redis.db                       | Redis database index                                             | If storageType is REDIS | 4           |
| network.url          | URL for sending telemetry data to the network data platform       | Yes      | -             |
| rawData.url          | URL for sending raw telemetry data to participant data platform   | Optional | -             |

### Sample Config:
```json
{
  "participantId": "test.bap-123",
  "participantUri": "https://test.bap-123.io",
  "role": "BAP",
  "telemetry": {
    "batchSize": 100,
    "syncInterval": 5,
    "retry": 3,
    "storageType": "local",
    "backupFilePath": "backups",
    "redis": {
       "host": "localhost",
       "port": 6379,
       "db": 4
    },
    "network": {
      "url": "https://url-to-network-data-platform"
    },
    "rawData": {
      "url": "https://url-to-participant-data-platform"
    }
  }
}
```

### Telemetry Event Types:

SDK generates the following type of events:

1. API Event - This event will be sent to network data platform.
2. Raw Event - This event will be sent to participant data platfrom.

API Event Example: 
```json
{
  "eid": "API",
  "ets": 1707110363073,
  "ver": "1.0",
  "context": {
    "domain": "onest:learning-experiences",
    "producer": {
      "id": "le-ps-bap-network.onest.network",
      "uri": "http://le-ps-bap-network.onest.network"
    }
  },
  "data": {
    "url": "/on_search",
    "method": "POST",
    "action": "on_search",
    "transactionid": "a9aaecca-10b7-4d19-b640-b047a7c62196",
    "msgid": "0d30bfbf-87b8-43d2-8f95-36ebb9a24fd6",
    "source": {
      "id": "le-ps-bpp-network.onest.network",
      "type": "provider",
      "uri": "https://le-ps-bpp-network.onest.network"
    },
    "target": {
      "id": "le-ps-bap-network.onest.network",
      "type": "seeker",
      "uri": "https://le-ps-bap-network.onest.network"
    },
    "statuscode": "200",
    "duration": 350
  },
  "mid": "42e6472b38c0ce6d908f673b32521216"
}
```

Raw Event Example:
```json
{
  "context": {
    "domain": "onest:learning-experiences",
    "action": "on_search",
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
  "message": {
    "item": {}
  },
  "response": {
    "statuscode": "200",
    "duration": 350,
    "message": {
      "ack": {
        "status": "ACK"
      }
    }
  }
}
```

### Genrate Telemetry Using Middleware:

```javascript
app.use(telemetryMiddleware(config));
```
Method Arguments:
config: [Link to Sample Config](#sample-config)


Telemetry middleware signature:
```javascript
export const telemetryMiddleware = (inputConfig) => {

    Telemetry.init(inputConfig);

    const generate = async (req, res, next) => {
        res.body.statusCode = res?.statusCode;
        Telemetry.generate(req.body, res.body);
        next();
    };

    return generate;
};
```
Method Arguments:
req.body:
```json
{
    "context": {
        "domain": "onest:learning-experiences",
        "action": "search",
        "version": "1.1.0",
        "bap_id": "le-ps-bap-network.onest.network",
        "bap_uri": "https://le-ps-bap-network.onest.network",
        "transaction_id": "a9aaecca-10b7-4d19-b640-b047a7c62196",
        "message_id": "0d30bfbf-87b8-43d2-8f95-36ebb9a24fd6",
        "ttl": "PT10M",
        "timestamp": "2023-02-15T15:14:30.560Z"
    },
    "message": {}
}
```

res.body
```json
{
    "statusCode" : "",
    "message": {
        "ack": {
            "status": "ACK"
        }
    }
}
```

### Generate Telemetry Using Class:

Telemetry is a singleton class, once it is initialized, can be used anywhere in the application to generate the telemetry.
Method signature:
```javascript
Telemetry.init(config);
```
Method Arguments:
config:
```json
{
  "participantId": "test.bap-123",
  "participantUri": "https://test.bap-123.io",
  "role": "BAP",
  "telemetry": {
    "batchSize": 100,
    "syncInterval": 5,
    "retry": 3,
    "storageType": "local",
    "backupFilePath": "backups",
    "redis": {
       "host": "localhost",
       "port": 6379,
       "db": 4
    },
    "network": {
      "url": "https://url-to-network-data-platform"
    },
    "rawData": {
      "url": "https://url-to-participant-data-platform"
    }
  }
}
```

```javascript
Telemetry.generate(request,response);
```
Method Arguments:
request:
```json
{
    "context": {
        "domain": "onest:learning-experiences",
        "action": "search",
        "version": "1.1.0",
        "bap_id": "le-ps-bap-network.onest.network",
        "bap_uri": "https://le-ps-bap-network.onest.network",
        "transaction_id": "a9aaecca-10b7-4d19-b640-b047a7c62196",
        "message_id": "0d30bfbf-87b8-43d2-8f95-36ebb9a24fd6",
        "ttl": "PT10M",
        "timestamp": "2023-02-15T15:14:30.560Z"
    },
    "message": {}
}
```

response:
```json
{
    "statusCode" : "",
    "duration": "",
    "message": {
        "ack": {
            "status": "NACK"
        }
    },
    "error": {
      "code": "string",
      "paths": "string",
      "message": "string"
  }
}
```
