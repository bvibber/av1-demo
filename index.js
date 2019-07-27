const express = require('express');
const app = express();
const port = 8080;

const Encoder = require('./encoder.js');
let encoding = false;
let encodingIndex = 0;
let encoder = null;

//app.get('/', (req, res) => res.send('Hello world'));

app.get('/encoding', (req, res) => {
    res.json(encoding);
});

app.post('/encode', (req, res) => {
    if (encoding) {
        res.json(null);
    } else {
        const url = `output/hls-stream-${encodingIndex}-master.m3u`;
        encoding = true;
        encodingIndex++;
        encoder = new Encoder(url);
        encoder.start().then(() => {
            encoding = false;
        });
        res.json(url);
    }
});

app.use(express.static('dist'));

app.use('/output', express.static('output'));

app.listen(port, () => console.log(`AV1 demo running on port ${port}`));
