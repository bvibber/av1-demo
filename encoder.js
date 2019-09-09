const child_process = require('child_process');
const config = require('./config.json');

class Encoder {
    constructor(options) {
        this.dest = options.dest;
        this.base = options.base;
    }

    start() {
        return new Promise((resolve, reject) => {
            let ffmpeg = config.ffmpeg;
            let input = 'media/' + config.input;
    
            let args = [];
            //args.push('-loglevel', 'debug');

            args.push('-re');
            args.push('-i');
            args.push(input);

            for (let i = 0; i < config.resolutions.length; i++) {
                args.push('-map', '0:v:0');
            }

            for (let i = 0; i < config.resolutions.length; i++) {
                args.push(`-filter:v:${i}`, `scale=w=${config.resolutions[i][0]}:h=${config.resolutions[i][1]}`);
                args.push(`-c:v:${i}`, 'libsvt_av1');
                args.push(`-b:v:${i}`, `${config.bitrates[i]}`);
            }

            if (config.threads) {
                args.push('-threads', String(config.threads));
            }
            args.push('-tile-columns', '2');
            //args.push('-rc', 'vbr');
            args.push('-flags', 'cgop');
            args.push('-forced-idr', '1');
            args.push('-qp', '42');

            args.push('-f', 'dash');
            args.push('-live', '1');
            args.push('-seg_duration', '1');
            args.push('-window_size', '7200');
            args.push('-use_template', '1');
            args.push('-use_timeline', '0');
            args.push('-init_seg_name', this.base + '.$RepresentationID$.init.webm');
            args.push('-media_seg_name', this.base + '.$RepresentationID$.$Number$.webm');
            args.push('-dash_segment_type', 'webm');
            args.push('-adaptation_sets', 'id=0,streams=v');
            args.push('-y');
            args.push(this.dest);
    
            const options = {
                maxBuffer: 1024 * 1024 * 10,
            };
            console.log(ffmpeg, args);
            child_process.execFile(ffmpeg, args, options, (error, stdout, stderr) => {
                console.log('return code', error);
                console.log(stdout);
                console.error(stderr);
                resolve();
            });
        });
    }
}

module.exports = Encoder;
