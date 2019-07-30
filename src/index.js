//const videojs = require('video.js').default;
//require('!style-loader!css-loader!video.js/dist/video-js.css');
require('./dash.all.min.js');

let FakeDash = require('./fakedash.js');

console.log('hello world');

const output = document.getElementById('output');

//videojs.log.level('debug');

function showVideo(url) {
    const link = document.createElement('a');
    link.href = url;
    link.textContent = url;

    output.className = '';
    output.textContent = '';

    const video = document.createElement('video');
    video.width = 1280;
    video.height = 720;
    video.controls = true;
    video.playsInline = true;
    video.muted = true;

    output.className = 'player';
    output.appendChild(link);

    const div = document.createElement('div');
    output.appendChild(div);
    div.appendChild(video);


    if (navigator.userAgent.match(/Safari/)) {
        let fd = new FakeDash(video, url);
        fd.load();
        fd.onsegmentloaded = (arr) => {
            let len = arr.byteLength;
            let bw = Math.round(len * 8 / 1000) + 'kbits/s';
            document.getElementById('bw').textContent = bw;
        };
        video.addEventListener('loadedmetadata', () => {
            let res = `${video.videoWidth}x${video.videoHeight}`;
            document.getElementById('res').textContent = res;
        });
    } else {
        let mp = dashjs.MediaPlayer().create();
        mp.initialize(video, url, true /* autoplay */);
        mp.on('fragmentLoadingCompleted', (event) => {
            if (event.response) {
                let len = event.response.byteLength;
                let bw = Math.round(len * 8 / 1000) + 'kbits/s';
                document.getElementById('bw').textContent = bw;
            }
        });
        mp.on('qualityChangeRendered', (event) => {
            //let qual = event.newQuality;
            let res = `${video.videoWidth}x${video.videoHeight}`;
            document.getElementById('res').textContent = res;
        });
    }
}

function awaitVideo(url) {
    fetch(url).then((response) => {
        if (response.status == 404) {
            setTimeout(() => {
                awaitVideo(url);
            }, 250);
        } else {
            showVideo(url);
        }
    });
}

document.getElementById('encode').onclick = function(event) {
    this.disabled = true;
    output.textContent = 'contacting server';

    fetch('/encode', {
        method: 'POST',
        body: 'do it' // ignored
    }).then(response => response.json()).then((url) => {
        this.disabled = false;
        awaitVideo(url);
    });
};

fetch('/current', {
    method: 'GET',
}).then(response => response.json()).then((url) => {
    if (url) {
        showVideo(url);
    }
});