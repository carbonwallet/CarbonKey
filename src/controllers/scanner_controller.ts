import { Controller } from "stimulus"
import * as snackbar from 'node-snackbar'
import { processQRCode } from './util'

// =======================================================================
// The QR code scanner
// To create a scanner in a PWA you need to do the following
// 1. Capture video input from the camera to a canvas
// 2. Send the contents of the canvas via a timer to a service worker
// 3. The sevice worker uses javascript libraries to scan for the QR.
// 4. Results are sent back via a message channel.
// =======================================================================

export default class extends Controller {

  // Globals for the scanner. Should look at reducing this.
  scannerIsRunning = false
  player = null
  localMediaStream = null
  context = null
  canvas = null
  qrcodeWorker = null

  initialize() {
    // A web worker for running the main QR code parsing on
    // a background thread.
    this.qrcodeWorker = new Worker("qrcode-web-worker.js");
    const controller = this
    this.qrcodeWorker.addEventListener('message', function (e) {

      var resultData = e.data;

      if (resultData.result !== false) {

        if (navigator.vibrate)
          navigator.vibrate(200);
          processQRCode(resultData.result);

        //this.initHomePage();

      } else {
        // if not found, retry

        document.getElementById('scans').innerHTML = resultData.error;

        controller.scanCode(false);
      }
    });
  }

  connect() {
    console.log("Scanner Connected")
    this.startScanner()
  }

  disconnect() {
    console.log('Switching off camera.');
    if (this.player) {
      this.player.pause();
      this.player.src = "";
      this.localMediaStream.getTracks()[0].stop();
    }
  }

  startScanner() {

    const controller = this

    try {

      if (navigator.mediaDevices.getUserMedia) {
        // Request the camera.
        navigator.mediaDevices.enumerateDevices()
          .then(function (devices) {
            const device = devices.filter(function (device) {
              if (device.kind == "videoinput") {
                return device;
              }
            });

            var constraints
            if (device.length > 1) {

              constraints = {
                video: {
                  mandatory: {
                    sourceId: device[device.length - 1].deviceId ? device[device.length - 1].deviceId : null
                  }
                },
                audio: false
              };

              if (controller.isIOS()) {
                constraints.video.facingMode = 'environment';
              }
              controller.startCapture(constraints);

            } else if (device.length) {
              constraints = {
                video: {
                  mandatory: {
                    sourceId: device[0].deviceId ? device[0].deviceId : null
                  }
                },
                audio: false
              };

              if (controller.isIOS()) {
                constraints.video.facingMode = 'environment';
              }

              if (!constraints.video.mandatory.sourceId && !controller.isIOS()) {
                controller.startCapture({ video: true });
              } else {
                controller.startCapture(constraints);
              }

            } else {
              controller.startCapture({ video: true });
            }
          })
          .catch(function (error) {
            alert("Error occurred : " + error);
          });
        controller.scannerIsRunning = true;

      } else {
        alert('Sorry, your browser does not support getUserMedia');
      }
    } catch (e) {
      alert(e);
    }
  }

  startCapture(constraints) {

    const controller = this

    var success = function (localMediaStream) {
      document.getElementById('about').style.display = 'none';
      // Get a reference to the video element on the page.
      var vid = document.getElementById('camera-stream');

      // Create an object URL for the video stream and use this 
      // to set the video source.
      if (vid instanceof HTMLVideoElement) {
        vid.srcObject = localMediaStream;

        controller.player = vid;
        controller.localMediaStream = localMediaStream;
        controller.canvas = document.getElementById('qr-canvas');
        controller.context = controller.canvas.getContext('2d');
        controller.scanCode(true);
      }
    }

    var failure = function (err) {
      // Log the error to the console.
      snackbar.show({ text: 'Error getUserMedia: ' + err, pos: 'bottom-center' })
    };

    // For iOS we have another of assuring we get the rear camera.
    if (this.isIOS()) {
      constraints = { audio: false, video: { facingMode: { exact: "environment" } } };
    }

    navigator.mediaDevices.getUserMedia(constraints).then(success).catch(failure);
  }


  isIOS() {
    return !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
  }

  scanCode(wasSuccess) {

    const controller = this

    setTimeout(function () {

      try {

        var width = controller.player.videoWidth;
        var height = controller.player.videoHeight;

        controller.canvas.width = width;
        controller.canvas.height = height;

        // capture current snapshot
        controller.context.drawImage(controller.player, 0, 0, width, height);

        var imageData = controller.context.getImageData(0, 0, width, height);

        // scan for QRCode
        const message = {
          cmd: 'process',
          width: width,
          height: height,
          imageData: imageData
        };

        controller.qrcodeWorker.postMessage(message);
      } catch (e) {
        console.log(e);
      }

    }, wasSuccess ? 2000 : 500);
  }
}