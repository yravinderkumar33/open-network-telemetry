import express from 'express';
import { telemetryMiddleware } from '../src/impl/TelemetryMiddleware.js';

var app = express();
app.use(express.json());

let config = {
    "participantId": "le-ps-bap-network.onest.network",
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
            "url": "https://webhook.site/a853899d-9d40-416b-aa8d-b04a268ebc54"
        },
        "raw": {
            "url": "https://webhook.site/9823f7cf-5a6c-44bb-9b23-7d09701e6e86"
        }
    }
}

app.use(telemetryMiddleware(config));

app.post('/telemetry/generate', function (req, res) {
   console.log('in telemetry api');
   const responseData = {
    message: 'Telemetry data generated successfully',
    data: {
        // Your telemetry data here
    }
};
res.json(responseData);
})

var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Example app listening at http://%s:%s", host, port)
})