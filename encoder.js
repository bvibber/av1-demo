const child_process = require('child_process');

class Encoder {
    constructor(options) {
        this.dest = options.dest;
        this.bitrate = options.bitrate;
        this.width = options.width;
        this.height = options.height;
    }

    start() {
        return new Promise((resolve, reject) => {
            let ffmpeg = '/opt/svt-av1/bin/ffmpeg'; // fixme
            let input = 'media/Fallout4.y4m';
            let threads = 6;
    
            let args = [];
            args.push('-i');
            args.push(input);
            if (this.width && this.height) {
                args.push('-vf');
                args.push(`scale=w=${this.width}:h=${this.height}:force_original_aspect_ratio=decrease`);
            }
            args.push('-c:v');
            args.push('libsvt_av1');
            args.push('-threads');
            args.push(String(threads)); // fixme
            args.push('-tile-columns');
            args.push('2');
            args.push('-rc');
            args.push('vbr');
            args.push('-flags');
            args.push('cgop');
            args.push('-forced-idr');
            args.push('1');
            args.push('-b:v');
            args.push(String(this.bitrate));
            args.push('-hls_segment_type');
            args.push('fmp4');
            // args.push('-hls_segment_filename');
            // args.push(input + '.%03d.mp4');
            // args.push('-hls_fmp4_init_filename');
            // args.push(input + '.init.mp4');
            args.push('-hls_list_size');
            args.push('99999');
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
