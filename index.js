const fs = require('fs');

const express = require('express');
const app = express();
const port = 8080;

let devHack = false; // enable hacks for running faster on dev station
let threads = 0; // auto

// Uncomment this during testing only
//devHack = true; threads = 6;

const Encoder = require('./encoder.js');
const config = require('./config.json');

let encoding = false;
let encodingIndex = 0;
let encoder = null;
let currentUrl = null;
let lastEncoder = null;

//app.get('/', (req, res) => res.send('Hello world'));

app.get('/current', (req, res) => {
    res.json(currentUrl);
});

app.get('/config', (req, res) => {
    res.json(config);
});

app.post('/encode', (req, res) => {
    if (encoding) {
        res.json(null);
    } else {
        if (lastEncoder) {
            lastEncoder.cleanup();
        }
        const base = `dash-stream-${encodingIndex}.mpd`;
        const main = `output/${base}`;

        const url = main;

        encoding = true;
        currentUrl = url;
        encodingIndex++;

        let options = {
            dest: main,
            base: base,
        };
        encoder = new Encoder(options);
        encoder.start().then(() => {
            encoding = false;
            currentUrl = null;
            lastEncoder = encoder;
        });
        res.json(url);
    }
});

app.use(express.static('dist'));

app.use('/output', express.static('output'));

app.listen(port, () => console.log(`AV1 demo running on port ${port}`));
