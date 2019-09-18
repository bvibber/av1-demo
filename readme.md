# AV1 live encoding and DASH playback demo

The demo app consists of two parts: a node-based web service which calls out to `ffmpeg` for encoding a video to AV1 WebM/DASH, and the front-end web page that plays the resulting stream either natively or using the `ogv.js` WebAssembly shim.

## Dependencies

* node
* dash.js (bundled)
* ogv.js (bundled)
* SVT-AV1
* ffmpeg with SVT-AV1 patches from https://github.com/brion/FFmpeg/tree/svt-av1

## Configuration

A `config.json` file is needed in the main directory with info on the tools to run. See `config.dev.json` and `config.prod.json` for examples on a Mac laptop and a big Linux server respectively.

## Installation

On server, check out the source:

```
git clone https://github.com/brion/av1-demo.git
```

And fetch modules and build local resources:

```
cd av1-demo
npm install
npm run-script build
```

## Running

This will start a web server on port 8080:

```
node index.js
```

Go to http://localhost:8080 (or appropriate IP or hostname) to view the demo, where you can start an encoding/playback session.

## Issues

* User-agent sniffing may be a bit funky.
* Safari ogv.js shim is limited and experimental for streaming.
    * No seeking available in Safari
    * Files with audio won't work yet, as only one demuxer is supported
    * Performance is limited due to running on a single CPU thread and having no SIMD instructions in Safari's WebAssembly implementation. 360p30 or 480p24 is about the limit on a fast Mac or iPad.
* Safari may or may not work on iPad/iPhone? Check this.

## Future directions

* plan to refactor ogv.js's demux/play loop to support multiple demuxers and pre-buffered data so can provide an MSE-alike interface
* hope to integrate that more directly into DASH players then...
* if Apple's support for Safari's WebAssembly improves, multithreading will significantly improve the shim's performance.

