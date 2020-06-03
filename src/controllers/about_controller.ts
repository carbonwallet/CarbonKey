import { Controller } from "stimulus"
import { getHDWallet } from './util'

interface SizedEvent {
  width: number;
  height: number;
}

export default class extends Controller {

  static targets = ['bitidAddress', 'xpubAddress', 'isIOS', 'isAndroidPersistant', 'isAdded']

  readonly bitidAddressTarget!: HTMLParagraphElement
  readonly xpubAddressTarget!: HTMLParagraphElement
  readonly isIOSTarget!: HTMLParagraphElement
  readonly isAndroidPersistantTarget!: HTMLParagraphElement
  readonly isAddedTarget!: HTMLParagraphElement

  connect() {
    console.log("About connected")
    const xpub58 = getHDWallet().neutered().toBase58()
    this.xpubAddressTarget.innerText = xpub58.substr(xpub58.length - 8)
  }

  isSizedEvent(e: any): e is SizedEvent {
    return (e && e.width !== undefined && e.height !== undefined);
  } 

  scanFromFile(e : Event) {

    const controller = this
    /* global Image */
    var img = new Image();
    img.onload = function(event) {
      if(controller.isSizedEvent(event)) {
        console.log(event.width + " " + event.height);

        // Convert to image data by drawing it into a canvas.
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        canvas.width = event.width;
        canvas.height = event.height;
        context.drawImage(canvas, 0, 0);
        var myData = context.getImageData(0, 0, img.width, img.height);

        // scan for QRCode
        const message = {
            cmd: 'process',
            width: event.width,
            height: event.height,
            imageData: myData
        }
      }
    }
  }
}

//qrcodeWorker.postMessage(message);
//var _URL = window.URL || window.webkitURL;
//img.src = _URL.createObjectURL(fileList[0]);