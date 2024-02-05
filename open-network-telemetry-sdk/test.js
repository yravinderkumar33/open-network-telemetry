import Telemetry from "./src/impl/Telemetry.js"

function testfunction(){
    const telemetryInstance = new Telemetry();

    let config = {
        "participantId": "le-ps-bap-network.onest.network",
        "participantUri": "http://le-ps-bap-network.onest.network",
        "domain": "onest:learning-experiences",
        "role": "BAP",
        "telemetry": {
            "batchSize": 1,
            "syncInterval": 5,
            "retry": 3,
            "storageType": "REDIS",
            "backupFilePath": "backups",
            "redis": {
                "host": "localhost",
                "port": 6379,
                "db": 4
            },
            "network": {
                "url": "https://webhook.site/4571d2bf-2a2f-4fd9-a2e3-1af6df3458c6"
            },
            "raw": {
                "url": "https://webhook.site/70702cd1-a3c3-44bb-9b75-66b3b57e0ffa"
            }
        }
    }

    let request = {
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

    let response = {
        "statuscode" : "200",
        "duration": 350,
        "message": {
            "ack": {
                "status": "ACK"
            }
        }
    }

    telemetryInstance.init(config)

    telemetryInstance.generate(request, response)
}

testfunction()