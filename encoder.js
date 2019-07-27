const child_process = require('child_process');

class Encoder {
    constructor(dest) {
        this.dest = dest;
    }

    encode() {
        return new Promise((resolve, reject) => {
            let ffmpeg = '/opt/svt-av1/bin/ffmpeg'; // fixme
            let input = 'Fallout4.y4m';
            let bitrate = 8000000;
    
            let args = [];
            args.push('-i');
            args.push(input);
            args.push('-c:v');
            args.push('libsvt_av1');
            args.push('-tile-columns');
            args.push('2');
            args.push('-rc');
            args.push('vbr');
            args.push('-flags');
            args.push('cgop');
            args.push('-forced-idr');
            args.push('1');
            args.push('-b:v');
            args.push(String(bitrate));
            args.push('-hls_segment_type');
            args.push('fmp4');
            // args.push('-hls_segment_filename');
            // args.push(input + '.%03d.mp4');
            // args.push('-hls_fmp4_init_filename');
            // args.push(input + '.init.mp4');
            args.push('-hls_list_size');
            args.push('99999');
            args.push('-y');
            args.push(dest);
    
            child_process.execFile(ffmpeg, args, (error, stdout, stderr) => {
                resolve();
            });
        });
    }
}

module.exports = Encoder;
