import { Telemetry } from "../src/impl/Telemetry.js"

function testfunction(){

    let config = {
        "participantId": "le-ps-bap-network.onest.network",
        "participantUri": "http://le-ps-bap-network.onest.network",
        "domain": "onest:learning-experiences",
        "role": "BAP",
        "telemetry": {
            "batchSize": 100,
            "syncInterval": 5,
            "retry": 3,
            "storageType": "LOCAL",
            "backupFilePath": "backups",
            "redis": {
                "host": "localhost",
                "port": 6379,
                "db": 4
            },
            "network": {
                "url": "https://webhook.site/a853899d-9d40-416b-aa8d-b04a268ebc54-1"
            },
            "raw": {
                "url": "https://webhook.site/9823f7cf-5a6c-44bb-9b23-7d09701e6e86-1"
            }
        }
    }

    let request1 = {
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
        "message": {}
    }

    let response1 = {
        "statuscode" : "200",
        "duration": 350,
        "message": {
            "ack": {
                "status": "ACK"
            }
        }
    }

    Telemetry.init(config)

    Telemetry.generate(request1, response1)

    
    let request2 = {
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

    let response2 = {
        "statuscode" : "200",
        "duration": 350,
        "message": {
            "ack": {
                "status": "ACK"
            }
        }
    }

    Telemetry.generate(request2, response2);
}

testfunction()