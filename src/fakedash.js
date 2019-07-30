// fake dash for ogv.js
// makes many assumptions ;)

require('./ogv.js');

class AppendOnlyInputStream {
    constructor(type) {
        this.type = type;
        this.segments = [];
        this.segmentOffsets = [];
        this.max = 0;
        this.onbufferlow = null;

        this.seekable = false;
        this.length = -1;
        this.offset = 0;
        this.eof = false;
        this.loaded = false;
        this.loading = false;
        this.buffering = false;
        this.seeking = false;
        this.headers = {
            'content-type': 'video/webm'
        };
    }

    appendBuffer(buffer) {
        console.log('appending ' + buffer.byteLength);
        this.segments.push(buffer);
        this.segmentOffsets.push(this.max);
        this.max += buffer.byteLength;
    }

    // StreamFile methods

    load() {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    bytesAvailable(max=Infinity) {
        let available = this.max - this.offset;
        return Math.min(available, max);
    }

    seek(offset) {
        throw new Error('no seek');
    }

    buffer(nbytes) {
        this.buffering = true;
        return new Promise((resolve, reject) => {
            if (this.eof || this.bytesAvailable(nbytes)) {
                this.buffering = false;
                resolve();
            }

            if (this.onbufferlow) {
                this.onbufferlow().then(() => {
                    this.buffering = false;
                    this.buffer(nbytes).then(resolve);
                })
            } else {
                throw new Error('no onbufferlow');
            }
        });
    }

    read(nbytes) {
        return new Promise((resolve, reject) => {
            this.buffer(nbytes).then(() => {
                resolve(this.readSync(nbytes));
            });
        })
    }

    readSync(nbytes) {
        let start = this.offset;
        let end = Math.min(this.max, start + nbytes);
        let buf = new Uint8Array(end - start);
        let bufOffset = 0;

        // oh a horrible hack
        let segmentIndex = 0;
        let segment = null;
        let segmentOffset = 0;
        for (let i = 0; i < this.segments.length; i++) {
            if (this.offset < this.segmentOffsets[i]) {
                continue;
            }
            segmentIndex = i;
            segment = new Uint8Array(this.segments[segmentIndex]);
            segmentOffset = this.segmentOffsets[segmentIndex];
            break;
        }
        for (let i = 0; i < end - start; i++) {
            let n = i + start - segmentOffset;
            if (n >= segment.length) {
                segmentIndex++;
                segmentOffset = this.segmentOffsets[segmentIndex];
                segment = new Uint8Array(this.segments[segmentIndex]);
                n = 0;
            }
            buf[i] = segment[n];
        }
        console.log('readSync got ' + buf.length + ' for ' + nbytes + ' at ' + this.offset);
        //console.log(buf);
        this.offset += buf.length;
        return buf.buffer;
    }

    abort() {
        // ...
    }

    close() {
        // ...
    }

    getBufferedRanges() {
        return [[0, this.max]];
    }
}

class FakeDash {
    constructor(video, url) {
        window.fd = this;

        this.video = video;
        this.div = document.createElement('div');
        this.video.parentNode.replaceChild(this.div, this.video);

        this.url = (new URL(url, location.toString())).toString();
        this.stream = new AppendOnlyInputStream();
        this.stream.onbufferlow = () => {
            return this.fetchNextSegment();
        }

        this.segmentInfo = null;
        this.nextSegment = 0;
        this.duration = 0;
        this.buffering = true;

        this.ogv = new OGVPlayer({
            stream: this.stream,
            video: this.video,
            //debug: true,
        });
        this.ogv.width = video.width;
        this.ogv.height = video.height;
        this.div.appendChild(this.ogv);

        this.fails = 0;
    }

    load() {
        fetch(this.url).then((response) => {
            return response.text();
        }).then((text) => {
            this.processMPD(text);
        
            if (!this.segmentInfo) {
                throw new Error('No available segments');
            }

            this.nextSegment = this.segmentInfo.start;
            this.fetchInitSegment();
        });
    }

    processMPD(text) {
        let parser = new DOMParser();
        let node = parser.parseFromString(text, 'text/xml');
        console.log(node);

        let set = node.querySelector('AdaptationSet'); // just the first for now
        let reps = set.querySelectorAll('Representation');
        for (let i = 0; i < reps.length; i++) {
            let rep = reps[i];
            let id = rep.getAttribute('id');
            let type = rep.getAttribute('mimeType') + '; codecs="' + rep.getAttribute('codecs') + '"';
            let height = parseInt(rep.getAttribute('height'));
            if (height > 480) {
                console.log('skipping high res input', rep);
                continue;
            }
            console.log(id, type, height, rep);

            let template = rep.querySelector('SegmentTemplate');

            this.repId = id;
            this.segmentInfo = {
                duration: parseInt(template.getAttribute('duration')) / parseInt(template.getAttribute('timescale')),
                init: template.getAttribute('initialization'),
                media: template.getAttribute('media'),
                start: parseInt(template.getAttribute('startNumber')),
            };
            
            // only handle one
            break;
        }
    }

    fetchInitSegment() {
        let local = this.segmentInfo.init;
        let url = (new URL(local, this.url)).toString();

        fetch(url).then((response) => {
            if (response.status == 404) {
                setTimeout(() => {
                    this.fetchInitSegment();
                }, 250);
            } else {
                response.arrayBuffer().then((buf) => {
                    this.stream.appendBuffer(buf);
                    this.fetchNextSegment();
                });
            }
        });
    }

    fetchNextSegment() {
        if (this.fetching) {
            return this.fetching;
        }
        return this.fetching = new Promise((resolve, reject) => {
            let fetchit = () => {
                let index = this.nextSegment;
                let local = this.segmentInfo.media
                    .replace('$RepresentationID$', this.repId)
                    .replace('$Number$', String(index));
                let url = (new URL(local, this.url)).toString();
                fetch(url).then((response) => {
                    if (response.status >= 400) {
                        this.fails++;
                        if (this.fails > 20) {
                            throw new Error('too many fails');
                        }
                        setTimeout(() => {
                            fetchit();
                        }, 250);
                    } else {
                        this.fails = 0;
                        this.nextSegment++;
                        response.arrayBuffer().then((buf) => {
                            this.stream.appendBuffer(buf);
                            this.duration += this.segmentInfo.duration;
        
                            if (this.duration - this.ogv.currentTime < 3) {
                                setTimeout(() => {
                                    this.fetchNextSegment();
                                }, 250);
                            } else if (this.buffering) {
                                this.buffering = false;
                                this.ogv.play();
                                this.video.play();
                            }
                            this.fetching = null;
                            resolve();
                        });
                    }
                });
            };
            fetchit();
        });
    }
}

module.exports = FakeDash;
