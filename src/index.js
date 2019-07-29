const videojs = require('video.js').default;
require('!style-loader!css-loader!video.js/dist/video-js.css');

console.log('hello world');

const output = document.getElementById('output');

videojs.log.level('debug');

function showVideo(url) {
    const link = document.createElement('a');
    link.href = url;
    link.textContent = url;

    const vlc = document.createElement('a');
    vlc.href = 'vlc:' + link.href;
    vlc.textContent = 'Open in VLC';

    output.className = '';
    output.textContent = '';
    if (navigator.userAgent.match(/iPhone|iPad|iPod/)) {
        output.className = 'vlc';
        output.appendChild(vlc);
    } else {
        const video = document.createElement('video');
        video.width = 854;
        video.height = 480;
        video.controls = true;
        video.playsInline = true;
        video.muted = true;
        video.className = 'video-js vjs-default-skin';

        output.className = 'player';
        output.appendChild(link);
        output.appendChild(video);

        const vjs = videojs(video);
        vjs.src({
            src: url,
            type: 'application/dash+xml'
        });
        vjs.play();
    }
}

document.getElementById('encode').onclick = function(event) {
    this.disabled = true;
    output.textContent = 'contacting server';

    fetch('/encode', {
        method: 'POST',
        body: 'do it' // ignored
    }).then(response => response.json()).then((url) => {
        this.disabled = false;

        showVideo(url);
    });
};

fetch('/current', {
    method: 'GET',
}).then(response => response.json()).then((url) => {
    if (url) {
        showVideo(url);
    }
});