const fs = require('fs');

const express = require('express');
const app = express();
const port = 8080;

let devHack = false; // enable hacks for running faster on dev station
let threads = 0; // auto
devHack = true;
threads = 6;

const Encoder = require('./encoder.js');
let encoding = false;
let encodingIndex = 0;
let encoder = null;
let currentUrl = null;

//app.get('/', (req, res) => res.send('Hello world'));

app.get('/current', (req, res) => {
    res.json(currentUrl);
});

app.post('/encode', (req, res) => {
    if (encoding) {
        res.json(null);
    } else {
        const base = `dash-stream-${encodingIndex}.mpd`;
        const main = `output/${base}`;
        const bitrate = 2000000;
        const bitrate_small = 1000000;

        const url = main;

        encoding = true;
        currentUrl = url;
        encodingIndex++;

        let options = {
            dest: main,
            base: base,
            bitrate: bitrate,
            bitrate_small: bitrate_small,
            devHack: devHack,
            threads: threads
        };
        if (devHack) {
            options.bitrate = options.bitrate / 2;
            options.bitrate_small = options.bitrate_small / 2;
            options.threads = 6;
        }
        encoder = new Encoder(options);
        encoder.start().then(() => {
            encoding = false;
        });
        res.json(url);
    }
});

app.use(express.static('dist'));

app.use('/output', express.static('output'));

app.listen(port, () => console.log(`AV1 demo running on port ${port}`));
