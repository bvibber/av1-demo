const child_process = require('child_process');

class Encoder {
    constructor(options) {
        this.dest = options.dest;
        this.base = options.base;
        this.bitrate = options.bitrate;
        this.bitrate_small = options.bitrate_small;
        this.width = options.width;
        this.height = options.height;
    }

    start() {
        return new Promise((resolve, reject) => {
            let ffmpeg = '/opt/svt-av1/bin/ffmpeg'; // fixme
            //let input = 'media/Fallout4.y4m';
            let input = 'media/sintel_trailer_2k_1080p24.y4m';
            let threads = 6; // fixme
    
            let args = [];
            args.push('-loglevel', 'debug');

            args.push('-i');
            args.push(input);

            args.push('-map', '0:v:0');
            args.push('-map', '0:v:0');

            args.push('-filter:v:0', `scale=w=856:h=480:force_original_aspect_ratio=decrease`);
            args.push('-c:v:0', 'libsvt_av1');
            args.push('-threads:v:0', String(threads));
            args.push('-tile-columns:v:0', '2');
            args.push('-rc:v:0', 'vbr');
            args.push('-flags:v:0', 'cgop');
            args.push('-forced-idr:v:0', '1');
            args.push('-b:v:0', String(this.bitrate_small));

            args.push('-c:v:1', 'libsvt_av1');
            args.push('-threads:v:1', String(threads));
            args.push('-tile-columns:v:1', '2');
            args.push('-rc:v:1', 'vbr');
            args.push('-flags:v:1', 'cgop');
            args.push('-forced-idr:v:1', '1');
            args.push('-b:v:1', String(this.bitrate));

            args.push('-f', 'dash');
            args.push('-live', '1');
            args.push('-seg_duration', '1');
            args.push('-window_size', '7200');
            args.push('-use_template', '1');
            args.push('-use_timeline', '0');
            args.push('-init_seg_name', this.base + '.init.webm');
            args.push('-media_seg_name', this.base + '.$RepresentationID$.$Number$.webm');
            args.push('-dash_segment_type', 'webm');
            args.push('-adaptation_sets', 'id=0,streams=v');
            args.push('-y');
            args.push(this.dest);
    
            const options = {
                maxBuffer: 1024 * 1024 * 10,
            };
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
