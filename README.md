# Open Network Telemetry
This repository contains code for below artifacts.
- Open Network Telemetry SDK

 <hr />

**Introduction**

Telemetry SDK will help to generate the different telemetry events (API/AUDIT/METRIC). These events sync to the server in a batch & in periodic intervals as per the configuration.

 <hr />

**SDK public interface**

Initialise the SDK by passing the required configurations.
```
init(config: Record<string, any>)
```

Middleware to register and generate API events for the action API's (search, select, init  etc). 
```
onApi(ctx: ITrace)(request: Request | Record<string, any>, response: Response | Record<string, any>, next?: NextFunction)
```

Middleware to register and generate TRACE events for the on_action API's (on_search, on_select, on_init  etc). 
```
onCallback(ctx: ITrace)(request: Request | Record<string, any>, response: Response | Record<string, any>, next?: NextFunction)
```

Method to generate metric event
```
onMetric(ctx: IMetric | IMetric[], additionalData: AdditionalData = {})
```

Method to generate audit event
```
onAudit(ctx: IAudit | IAudit[], additionalData: AdditionalData = {})
```

 <hr />

**Hashing logic to generate following - UUID**

```
scope_uuid = hash(spans, pid)
spanId  = message_id
span_uuid = hash (message_id, transaction_id, pid, ets)
traceId = transaction_id
```

 <hr />

**SDK Configuration**

```
let config = {
    "participantId": "<participant-d>",
    "participantUri": "<participant-uri>",
    "role": "<participant-role>",
    "telemetry": {
        "batchSize": 100,
        "syncInterval": 1,
        "retry": 3,
        "storageType": "REDIS",
        "backupFilePath": "backups",
        "redis": {
            "host": "localhost",
            "port": 6379,
            "db": 4
        },
        "network": {
            "url": ""
        },
        "raw": {
            "url": ""
        }
    },
    "service": {
        "name": "<service_name>",
        "version": "<service_version>"
    },
    "resource": {
        "attributes": {
            ...additional global attributes
        }
    }
}
```

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
| service.name          | service name producing the event   | Yes | -             |
| service.version          | service version producing the event   | Yes | -             |
| resource.attributes          | additional global contextual attributes    | Optional | {}       |


 <hr />

**Developer Section**

**init - Initializing the SDK**

Initialize the SDK middleware by passing the required configurations 

```
app.use(init(config));
```

<hr>

**onAPI** 

```
app.post('/search', Telemetry.onApi(ctx), controller)
```

```
const ctx = {
    "scope": {
        "attributes": {
            //additional scope level attributes (optional)
        }
    },
    "data": {
        "attributes": {
            //additional span level attributes (optional)
        },
        "events": []
    }
}
```

Note: Pass ctx if required to pass add attributes at scope level, span level or span level events

<hr>

**onCallback**

```
app.post('/on_search', Telemetry.onCallback(ctx), controller)
```

```
const ctx = {
    "scope": {
        "attributes": {}
    },
    "data": {
        "attributes": {},
        "events": []
    }
}
```

Note: Pass ctx if required to pass add attributes at scope level, span level or span level events

<hr />

**onMetric**

```
 Telemetry.onMetric(metrics, additionalData);
```

metrics
```
    [{
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
    }]
```

additionalData
```
{ "domain": "onest:learning-experiences", "attributes": { "addScopeAttr": "test" } }
```

**onAudit**

```
   Telemetry.onAudit(logs, additionalData)
```

logs
```
[
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
        }
]
```

additionalData
```
{ domain: "onest:learning-experiences" }
```

<hr>

**Sample Events**

**API**

```
{
  "resourceSpans": [
    {
      "resource": {
        "attributes": [
          {
            "key": "eid",
            "value": {
              "stringValue": "API"
            }
          },
          {
            "key": "producer",
            "value": {
              "stringValue": "le-ps-bap-network.onest.network"
            }
          },
          {
            "key": "domain",
            "value": {
              "stringValue": "onest:learning-experiences"
            }
          }
        ]
      },
      "scopeSpans": [
        {
          "scope": {
            "name": "discovery_service",
            "version": "1.0.0",
            "attributes": [
              {
                "key": "scope_uuid",
                "value": {
                  "stringValue": "8cc65f27fe15d70a4fd8cbb668dbfecb"
                }
              },
              {
                "key": "count",
                "value": {
                  "intValue": 1
                }
              }
            ]
          },
          "spans": [
            {
              "name": "search",
              "traceId": "a9aaecca-10b7-4d19-b640-b047a7c62196",
              "spanId": "0d30bfbf-87b8-43d2-8f95-36ebb9a24fd6",
              "startTimeUnixNano": "1708953017254121625",
              "endTimeUnixNano": "1708953017259175083",
              "status": "Ok",
              "attributes": [
                {
                  "key": "sender.id",
                  "value": {
                    "stringValue": "le-ps-bap-network.onest.network"
                  }
                },
                {
                  "key": "recipient.id",
                  "value": {
                    "stringValue": "le-ps-bpp-network.onest.network"
                  }
                },
                {
                  "key": "sender.uri",
                  "value": {
                    "stringValue": "https://le-ps-bap-network.onest.network"
                  }
                },
                {
                  "key": "recipient.uri",
                  "value": {
                    "stringValue": "https://le-ps-bpp-network.onest.network"
                  }
                },
                {
                  "key": "span_uuid",
                  "value": {
                    "stringValue": "7263d65a7b823cd691ab475a5fa838f8"
                  }
                },
                {
                  "key": "observedTimeUnixNano",
                  "value": {
                    "stringValue": "2023-02-15T15:14:30.560Z"
                  }
                },
                {
                  "key": "http.method",
                  "value": {
                    "stringValue": "POST"
                  }
                },
                {
                  "key": "http.route",
                  "value": {
                    "stringValue": "/search"
                  }
                },
                {
                  "key": "http.host",
                  "value": {
                    "stringValue": "localhost"
                  }
                },
                {
                  "key": "http.scheme",
                  "value": {
                    "stringValue": "http"
                  }
                },
                {
                  "key": "http.status.code",
                  "value": {
                    "intValue": 200
                  }
                }
              ],
              "events": [
                {
                  "name": "request_info",
                  "time": "2024-02-26T13:10:17.259Z",
                  "attributes": [
                    {
                      "key": "reqBody",
                      "value": {
                        "stringValue": "{\"context\":{\"domain\":\"onest:learning-experiences\",\"action\":\"search\",\"version\":\"1.1.0\",\"bap_id\":\"le-ps-bap-network.onest.network\",\"bap_uri\":\"https://le-ps-bap-network.onest.network\",\"bpp_id\":\"le-ps-bpp-network.onest.network\",\"bpp_uri\":\"https://le-ps-bpp-network.onest.network\",\"transaction_id\":\"a9aaecca-10b7-4d19-b640-b047a7c62196\",\"message_id\":\"0d30bfbf-87b8-43d2-8f95-36ebb9a24fd6\",\"ttl\":\"PT10M\",\"timestamp\":\"2023-02-15T15:14:30.560Z\"}}"
                      }
                    }
                  ]
                },
                {
                  "name": "response_info",
                  "time": "2024-02-26T13:10:17.259Z",
                  "attributes": [
                    {
                      "key": "resBody",
                      "value": {
                        "stringValue": "{\"message\":{\"ack\":{\"status\":\"ACK\"}}}"
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

**METRIC**
```
{
  "resourceMetrics": [
    {
      "resource": {
        "attributes": [
          {
            "key": "eid",
            "value": {
              "stringValue": "METRIC"
            }
          },
          {
            "key": "producer",
            "value": {
              "stringValue": "le-ps-bap-network.onest.network"
            }
          },
          {
            "key": "domain",
            "value": {
              "stringValue": "onest:learning-experiences"
            }
          }
        ]
      },
      "scopeMetrics": [
        {
          "scope": {
            "name": "discovery_service",
            "version": "1.0.0",
            "attributes": [
              {
                "key": "scope_uuid",
                "value": {
                  "stringValue": "16f34c661ff311c99d2e5993fa1b3f55"
                }
              },
              {
                "key": "count",
                "value": {
                  "intValue": 1
                }
              },
              {
                "key": "scopeAttr",
                "value": {
                  "stringValue": "test"
                }
              }
            ]
          },
          "metrics": [
            {
              "name": "search_api_total_count",
              "unit": "1",
              "description": "Total number of search API Calls",
              "sum": {
                "aggregationTemporality": 1,
                "isMonotonic": false,
                "dataPoints": [
                  {
                    "asDouble": 15699,
                    "startTimeUnixNano": "1544712660000000000",
                    "endTimeUnixNano": "1544712660000000000",
                    "attributes": [
                      {
                        "key": "observedTimeUnixNano",
                        "value": {
                          "stringValue": "1708953110449644208"
                        }
                      },
                      {
                        "key": "code",
                        "value": {
                          "stringValue": "search_api_total_count"
                        }
                      },
                      {
                        "key": "category",
                        "value": {
                          "stringValue": "Discovery"
                        }
                      },
                      {
                        "key": "label",
                        "value": {
                          "stringValue": "Discovery total calls"
                        }
                      },
                      {
                        "key": "granularity",
                        "value": {
                          "stringValue": "day"
                        }
                      },
                      {
                        "key": "frequency",
                        "value": {
                          "stringValue": "day"
                        }
                      },
                      {
                        "key": "add1",
                        "value": {
                          "stringValue": "value"
                        }
                      }
                    ]
                  }
                ]
              }
            }
          ]
        }
      ]
    }
  ]
}
```

**AUDIT/LOG**
```
{
  "resourceLogs": [
    {
      "resource": {
        "attributes": [
          {
            "key": "eid",
            "value": {
              "stringValue": "AUDIT"
            }
          },
          {
            "key": "producer",
            "value": {
              "stringValue": "le-ps-bap-network.onest.network"
            }
          },
          {
            "key": "domain",
            "value": {
              "stringValue": "onest:learning-experiences"
            }
          }
        ]
      },
      "scopeLogs": [
        {
          "scope": {
            "name": "discovery_service",
            "version": "1.0.0",
            "attributes": [
              {
                "key": "scope_uuid",
                "value": {
                  "stringValue": "ec39b2f745769ab70d6c9f62f6900c7b"
                }
              },
              {
                "key": "count",
                "value": {
                  "intValue": 2
                }
              }
            ]
          },
          "logRecords": [
            {
              "timeUnixNano": "1708953017254670541",
              "observedTimeUnixNano": 1708953017254,
              "severityNumber": "5",
              "traceId": "123",
              "spanId": "ffea680e-f40f-4718-958e-ab62e86b4ac2",
              "body": {
                "stringValue": "User 'obsrv' successfully initiated order for book 'BOOK_001' from IP address 192.168.1.100."
              },
              "attributes": [
                {
                  "key": "id",
                  "value": {
                    "stringValue": "123-456-789"
                  }
                },
                {
                  "key": "type",
                  "value": {
                    "stringValue": "BOOK"
                  }
                },
                {
                  "key": "name",
                  "value": {
                    "stringValue": "BOOK_001"
                  }
                },
                {
                  "key": "code",
                  "value": {
                    "stringValue": "101"
                  }
                },
                {
                  "key": "prevstate",
                  "value": {
                    "stringValue": "init"
                  }
                },
                {
                  "key": "state",
                  "value": {
                    "stringValue": "completed"
                  }
                },
                {
                  "key": "duration",
                  "value": {
                    "stringValue": "10"
                  }
                }
              ]
            },
            {
              "timeUnixNano": "1708953017255153958",
              "observedTimeUnixNano": 1708953017254,
              "severityNumber": "1",
              "traceId": "456",
              "spanId": "c93d16ce-31f7-41e4-9454-38e2ea86f912",
              "body": {
                "stringValue": "User 'obsrv' successfully placed order for book 'BOOK_001' from IP address 192.168.1.100."
              },
              "attributes": [
                {
                  "key": "id",
                  "value": {
                    "stringValue": "123-456-789"
                  }
                },
                {
                  "key": "type",
                  "value": {
                    "stringValue": "BOOK"
                  }
                },
                {
                  "key": "name",
                  "value": {
                    "stringValue": "BOOK_001"
                  }
                },
                {
                  "key": "code",
                  "value": {
                    "stringValue": "101"
                  }
                },
                {
                  "key": "prevstate",
                  "value": {
                    "stringValue": "init"
                  }
                },
                {
                  "key": "state",
                  "value": {
                    "stringValue": "completed"
                  }
                },
                {
                  "key": "duration",
                  "value": {
                    "stringValue": "10"
                  }
                },
                {
                  "key": "author",
                  "value": {
                    "stringValue": "obsrv"
                  }
                },
                {
                  "key": "addlData.initdate",
                  "value": {
                    "stringValue": "2024-01-01T00:00:00.000+05:30"
                  }
                },
                {
                  "key": "addlData.paymentRefNumber",
                  "value": {
                    "stringValue": "b2aa-325096b39f47"
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

