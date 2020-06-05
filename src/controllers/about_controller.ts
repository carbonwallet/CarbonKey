import { Controller } from "stimulus"
import { getHDWallet, processQRCode } from './util'

export default class extends Controller {

  static targets = ['bitidAddress', 'xpubAddress', 'isIOS', 'isAndroidPersistant', 'isAdded']

  readonly bitidAddressTarget!: HTMLParagraphElement
  readonly xpubAddressTarget!: HTMLParagraphElement
  readonly isIOSTarget!: HTMLParagraphElement
  readonly isAndroidPersistantTarget!: HTMLParagraphElement
  readonly isAddedTarget!: HTMLParagraphElement


  qrcodeWorker = new Worker("qrcode-web-worker.js");

  connect() {
    console.log("About connected")
    const xpub58 = getHDWallet().neutered().toBase58()
    this.xpubAddressTarget.innerText = xpub58.substr(xpub58.length - 8)

    // A web worker for running the main QR code parsing on
    // a background thread.
    this.qrcodeWorker.addEventListener('message', function (e) {

      var resultData = e.data;

      console.log(resultData)

      if (resultData.result !== false) {

        if (navigator.vibrate)
          navigator.vibrate(200);

          processQRCode(resultData.result)
      }
    });
  }

  scanFromFile(e : Event) {

    const controller = this
    /* global Image */
    var img = new Image();
    img.onload = function() {
        console.log(img.width + " " + img.height);

        // Convert to image data by drawing it into a canvas.
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);
        var myData = context.getImageData(0, 0, img.width, img.height);

        // scan for QRCode
        const message = {
            cmd: 'process',
            width: img.width,
            height: img.height,
            imageData: myData
        }

        controller.qrcodeWorker.postMessage(message)
    }
    var _URL = window.URL || window.webkitURL;
    img.src = _URL.createObjectURL((<HTMLInputElement>e.target).files[0]);
  }
}