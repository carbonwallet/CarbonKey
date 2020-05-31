import { Controller } from "stimulus"
import * as snackbar from 'node-snackbar'
import * as bitcoin from 'bitcoinjs-lib'
import * as bip39 from "bip39"
import * as bip32 from 'bip32';
import * as message from 'bitcoinjs-message';

// =======================================================================
// The QR code scanner
// To create a scanner in a PWA you need to do the following
// 1. Capture video input from the camera to a canvas
// 2. Send the contents of the canvas via a timer to a service worker
// 3. The sevice worker uses javascript libraries to scan for the QR.
// 4. Results are sent back via a message channel.
// =======================================================================


interface Command {
  cmd: string
  service: string
  postBack: string
}

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
          controller.processQRCode(resultData.result);

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

  showResult(e) {
    var resultData = e.data;

    if (resultData.result !== false) {

      if (navigator.vibrate)
        navigator.vibrate(200);
      this.processQRCode(resultData.result);

      //this.initHomePage();

    } else {
      // if not found, retry

      document.getElementById('scans').innerHTML = resultData.error;

      this.scanCode(false);
    }
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

  // Decide what type of QR code this is i.e. BITID or transaction
  // signing and process.
  processQRCode(data: string) {

    const seeds = window.localStorage.getItem('seed_words')
    if (seeds != null) {
      const seedBuffer = bip39.mnemonicToSeedSync(seeds)
      const ecpair = bitcoin.ECPair.fromPrivateKey(seedBuffer)

      if (/^(bitid:).*$/.test(data) === true) {
        this.processBITID(data, ecpair);
      } else if (data.split("|").length > 3 === true) {
        var parsed = this.parseCommand(data);
        console.log('Command ' + parsed.cmd);
        if (parsed.cmd == 'mpk') {
          this.tether(ecpair, parsed);
        }
        if (parsed.cmd == 'sign') {
          this.signTransaction(ecpair, parsed);
        }
      } else {
        snackbar.show({ text: data, pos: 'bottom-center' })
      }
    }
  }

  processBITID(bitid_qr_code, ecpair: bitcoin.ECPairInterface) {

    console.log(bitid_qr_code);

    const msg = this.generateSignatureMessage(ecpair, bitid_qr_code);

    console.log(msg);

    /**$('#bitidModal').modal();

    $('#bitidConfirm').click(function () {
      snackbar.show({text: 'Authenticating', pos: 'bottom-center' })

      window.fetch(this.getCallBackURL(bitid_qr_code), {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(msg)
      }).then(function (response) {
        var contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return response.json();
        }
        throw new TypeError("Oops, we haven't got JSON! ");
      }).then(function (json) {
        if (json.message != null)
          throw ('Message Error ' + json.message);

        return json;
      }).then(function (json) {
        console.log(JSON.stringify(json));
        snackbar.show({text: 'Success ' + JSON.stringify(json), pos: 'bottom-center' })
      }).catch(function (error) {
        snackbar.show({text: 'Error ' + error, pos: 'bottom-center' })
      });

      return true;
    });**/
  }

  parseURI(address) {
    const reURLInformation = new RegExp([
      '^(bitid)://', // protocol
      '(([^:/?#]*)(?::([0-9]+))?)', // host (hostname and port)
      '(/[^?#]*)', // pathname
      '.x=([^\\&u=]*|)', // NONCE
      '.(u=[^#]*|)' // IS UNSECURE
    ].join(''));
    const match = address.match(reURLInformation);
    return match && {
      href: address,
      protocol: match[1],
      host: match[2],
      hostname: match[3],
      port: match[4],
      pathname: match[5],
      nonce: match[6],
      unsecure: match[7]
    };
  }

  createMessage(signature, pubKey, message) {
    return {
      uri: message,
      address: pubKey,
      signature: signature
    };
  }

  getBitIDSiteURI(parsed) {
    return parsed.protocol + ":" + parsed.host + parsed.pathname;
  }

  getSiteAddress(bitid: string) {
    const parsed = this.parseURI(bitid);
    const protocol = (parsed.unsecure != '') ? 'http://' : 'https://';
    return protocol + parsed.host;
  }

  getCallBackURL(bitid) {
    return this.getSiteAddress(bitid) + this.parseURI(bitid).pathname;
  }

  generateBITIDAddress(ecpair: bitcoin.ECPairInterface, site_uri) {

    var xpriv = bip32.fromSeed(ecpair.privateKey)

    const sha256URL = bitcoin.crypto.sha256(site_uri);
    const sha32uri = sha256URL.readInt32LE(1);

    const derived = xpriv.derivePath("m/0'/45342'/" + sha32uri + "/0");

    return derived;
  }

  generateSignatureMessage(ecpair: bitcoin.ECPairInterface, address) {

    const parsed = this.parseURI(address);

    const site_uri = this.getBitIDSiteURI(parsed);
    const derived = this.generateBITIDAddress(ecpair, site_uri);
    const pubKeyAddress = bitcoin.payments.p2pkh({ pubkey: derived.publicKey }).address!

    const message = parsed.href;

    // Sign the message
    const messagePrefix = bitcoin.networks.bitcoin.messagePrefix;

    const signature = message.sign(message, messagePrefix,
      ecpair, ecpair.compressed);

    const signed = signature.toString('base64');

    const fullMessage = this.createMessage(signed, pubKeyAddress, message);
    return fullMessage;
  }

  // =======================================================================
  // Tethering - Send a wallet one of our public keys. xpub format.
  // =======================================================================

  tether(ecpair: bitcoin.ECPairInterface, parsed) {
    console.log('Tether ' + JSON.stringify(parsed));

    const xpubB58 = this.getHDWalletDeterministicKey(ecpair).neutered().toBase58();
    const callbackURL = parsed.post_back;
    const bitidURI = parsed.bitid;
    const reqObj = this.buildRequestMPKObject(xpubB58, bitidURI, parsed, ecpair);

    const formData = this.arrayToQueryParams(reqObj);

    console.log(formData);

    /**$('#tetheringModal').modal();

    $('#tetheringConfirm').click(function () {
      snackbar.show({text: 'Tethering', pos: 'bottom-center' })

      window.fetch(callbackURL, {
        method: 'post',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: formData
      }).then(function (responseText) {
        console.log('Response from server ' + responseText);
        snackbar.show({text: 'Response from server ' + responseText, pos: 'bottom-center' })
      }).catch(function (error) {
        snackbar.show({text: 'Error ' + error, pos: 'bottom-center' })
      });

      return true;
    });**/
  }

  parseCommand(href: string): Command | null {
    const params = href.split("|");
    if (params.length >= 3) {
      var result = {
        cmd: params[0],
        service: params[1],
        postBack: params[2]
      };

      // Add in the extra paramters.
      for (var i = 4; i < params.length; i += 2) {
        result[params[i - 1]] = params[i];
      }

      return result
    }
    return null;
  }

  getHDWalletDeterministicKey(ecpair: bitcoin.ECPairInterface): bip32.BIP32Interface {
    var xpriv = bip32.fromSeed(ecpair.privateKey)

    const derivedByArgument = xpriv.derivePath("m/0");
    return derivedByArgument;
  }

  buildRequestMPKObject(mpk, site_uri, parsed, ecpair: bitcoin.ECPairInterface) {
    // Clone the parsed results.
    var result = JSON.parse(JSON.stringify(parsed));
    // remove the suff we don't want to send back
    delete result['cmd'];
    delete result['service'];
    delete result['post_back'];
    result['mpk'] = mpk;

    // We add in a bit ID address so the user can use CarbonKey to login.
    if (site_uri != undefined) {

      const keyPair = this.generateBITIDAddress(ecpair, site_uri)
      const addr = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey }).address!
      result['bitid_address'] = addr
    }
    return result;
  }

  arrayToQueryParams(arr) {
    var str = [];
    for (var p in arr)
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(arr[p]));
    return str.join("&");
  }

  // =======================================================================
  // Transaction Signing.
  // 1. Get the transaction from Carbon Wallet
  // 2. Sign the inputs
  // 3. Send the signatures back.
  // =======================================================================

  signTransaction(ecpair: bitcoin.ECPairInterface, parsed) {

    const call_back = parsed.post_back + '?' + this.arrayToQueryParams(parsed);

    console.log('Signing Call Back ' + call_back);

    window.fetch(call_back).then(function (response) {
      return response.text().then(function (text) {

        const signedSigList = this.signSigList(ecpair, text);

        const requestParamters = this.buildSignRequest(signedSigList, parsed);
        const formData = this.arrayToQueryParams(requestParamters);

        console.log(formData);

        // It's signed (Hopefully) send the signatures back.
        window.fetch(call_back, {
          method: 'post',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
          },
          body: formData
        }).then(function (response) {
          return response.text().then(function (text) {

            console.log('Response from server ' + text);
            snackbar.show({ text: 'Success ' + text, pos: 'bottom-center' })
          });
        }).catch(function (error) {
          snackbar.show({ text: 'Error ' + error, pos: 'bottom-center' })
        });

      });

    }).catch(function (error) {
      snackbar.show({ text: 'Error ' + error, pos: 'bottom-center' })
    });
  }

  buildSignRequest(signedSigList, parsed) {
    // Clone the parsed results.
    var result = JSON.parse(JSON.stringify(parsed));
    // remove the suff we don't want to send back
    delete result['cmd'];
    delete result['service'];
    delete result['post_back'];
    result['meta_data'] = signedSigList;

    return result;
  }

  signSigList(ecpair: bitcoin.ECPairInterface, transactionAndSigListText) {

    if (transactionAndSigListText.indexOf(':') == -1)
      throw ('Error, invalid Transaction');

    const sigList = JSON.parse(transactionAndSigListText.substring(
      transactionAndSigListText.indexOf(':') + 1,
      transactionAndSigListText.length));

    return JSON.stringify(this.signSignatureList(ecpair, sigList));
  }

  signSignatureList(key: bitcoin.ECPairInterface, sig_list) {

    const address = bitcoin.payments.p2pkh({ pubkey: key.publicKey }).address!
    var full_address = key.publicKey.toString('hex');

    for (var x = 0; x < sig_list.length; x++) {

      // Sometime the sig list has a full public address
      // sometimes a hashed address. We can sign for both.
      if (sig_list[x][address] != null) {
        const hash = sig_list[x][address]['hash'];

        const hash_buff = Buffer.from(hash, 'hex');

        const signed_hash = key.sign(hash_buff)
        const sigDer = bitcoin.script.signature.encode(signed_hash, 1)
        const sigWithoutHash = sigDer.slice(0, sigDer.length - 1);

        sig_list[x][address]['sig'] = sigWithoutHash;

      } else if (sig_list[x][full_address] != null) {
        const hash = sig_list[x][full_address]['hash'];

        const hash_buff = Buffer.from(hash, 'hex');

        const signed_hash = key.sign(hash_buff)
        const sigDer = bitcoin.script.signature.encode(signed_hash, 1)
        const sigWithoutHash = sigDer.slice(0, sigDer.length - 1);

        sig_list[x][full_address]['sig'] = sigWithoutHash;
      }
    }
    return sig_list;
  }
}