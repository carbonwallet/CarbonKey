import { Controller } from "stimulus"

export default class extends Controller {

  static targets = ['about', 'home', 'backup', 'restore', 'scanner']

  readonly aboutTarget!: HTMLDivElement
  readonly homeTarget!: HTMLDivElement
  readonly backupTarget!: HTMLDivElement
  readonly restoreTarget!: HTMLDivElement
  readonly scannerTarget!: HTMLDivElement

  connect() {
    console.log("Connected")
  }
}
    /** // =======================================================================
        // The QR code scanner
        // To create a scanner in a PWA you need to do the following
        // 1. Capture video input from the camera to a canvas
        // 2. Send the contents of the canvas via a timer to a service worker
        // 3. The sevice worker uses javascript libraries to scan for the QR.
        // 4. Results are sent back via a message channel.
        // =======================================================================
        function startScanner() {

            try {

                if (navigator.mediaDevices.getUserMedia) {
                    // Request the camera.
                    navigator.mediaDevices.enumerateDevices()
                        .then(function(devices) {
                            var device = devices.filter(function(device) {
                                if (device.kind == "videoinput") {
                                    return device;
                                }
                            });

                            if (device.length > 1) {
                                var deviceIndex = 1;

                                // On iOS grab 1st camera its the rear.
                                if (isIOS())
                                    deviceIndex = 0;

                                var constraints = {
                                    video: {
                                        mandatory: {
                                            sourceId: device[deviceIndex].deviceId ? 
                                                device[deviceIndex].deviceId : null
                                        }
                                    },
                                    audio: false
                                };
                                startCapture(constraints);
                            } else if (device.length) {
                                constraints = {
                                    video: {
                                        mandatory: {
                                            sourceId: device[0].deviceId ? device[0].deviceId : null
                                        }
                                    },
                                    audio: false
                                };
                                startCapture(constraints);
                            }
                        })
                        .catch(function(error) {
                            alert("Error occurred : ", error);
                        });
                    QRScanner.scannerIsRunning = true;

                } else {
                    alert('Sorry, your browser does not support getUserMedia');
                }
            } catch (e) {
                alert(e);
            }
        }

        function startCapture(constraints) {

            var success = function(localMediaStream) {
                document.getElementById('about').style.display = 'none';
                // Get a reference to the video element on the page.
                var vid = document.getElementById('camera-stream');

                // Create an object URL for the video stream and use this 
                // to set the video source.
                vid.srcObject = localMediaStream;

                QRScanner.player = vid;
                QRScanner.localMediaStream = localMediaStream;
                QRScanner.canvas = document.getElementById('qr-canvas');
                QRScanner.context = QRScanner.canvas.getContext('2d');
                scanCode(true);
            }

            var failure = function(err) {
                // Log the error to the console.
                snackBar('Error getUserMedia: ' + err);
            };

            // For iOS we have another of assuring we get the rear camera.
            if(isIOS()) {
                constraints = { audio: false, video: { facingMode: { exact: "environment" } } };
            } 

            navigator.mediaDevices.getUserMedia(constraints).then(success).catch(failure);
        }

        function showResult(e) {
            var resultData = e.data;

            if (resultData.result !== false) {

                if(navigator.vibrate)
                    navigator.vibrate(200);
                processQRCode(resultData.result);

                initHomePage();

            } else {
                // if not found, retry

                document.getElementById('scans').innerHTML = resultData.error;

                scanCode(false);
            }
        }

        function scanCode(wasSuccess) {

            setTimeout(function() {

                try {

                    var width = QRScanner.player.videoWidth;
                    var height = QRScanner.player.videoHeight;

                    QRScanner.canvas.width = width;
                    QRScanner.canvas.height = height;

                    // capture current snapshot
                    QRScanner.context.drawImage(QRScanner.player, 0, 0, width, height);

                    var imageData = QRScanner.context.getImageData(0, 0, width, height);

                    // scan for QRCode
                    const message = {
                        cmd: 'process',
                        width: width,
                        height: height,
                        imageData: imageData
                    };

                    qrcodeWorker.postMessage(message);
                } catch (e) {
                    console.log(e);
                }

            }, wasSuccess ? 2000 : 500);
        }

        function stopScanner() {
            console.log('Switching off camera.');
            if(QRScanner.player) {
                QRScanner.player.pause();
                QRScanner.player.src = "";
                QRScanner.localMediaStream.getTracks()[0].stop();
            }
        }

        // Decide what type of QR code this is i.e. BITID or transaction
        // signing and process.
        function processQRCode(data) {
            if (/^(bitid:).*$/.test(data) === true) {
                processBITID(data);
            } else if (data.split("|").length > 3 === true) {
                var parsed = parseCommand(data);
                console.log('Command ' + parsed.cmd);
                if (parsed.cmd == 'mpk') {
                    tether(CarbonKeyWallet.wif, parsed);
                }
                if (parsed.cmd == 'sign') {
                    signTransaction(CarbonKeyWallet.wif, parsed);
                }
            } else {
                snackBar(data);
            }
        }
        // End - QR code scanner

        // =======================================================================
        // Functions necessary for BITID authentification.
        // BITID is a protocol for authentication. https://github.com/bitid/bitid
        // =======================================================================

        function processBITID(bitid_qr_code) {

            console.log(bitid_qr_code);

            const msg = generateSignatureMessage(CarbonKeyWallet.wif, bitid_qr_code);

            console.log(msg);

            $('#bitidModal').modal();

            $('#bitidConfirm').click(function() {
                snackBar('Authenticating');

                window.fetch(getCallBackURL(bitid_qr_code), {
                    method: 'post',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(msg)
                }).then(function(response) {
                    var contentType = response.headers.get("content-type");
                    if (contentType && contentType.includes("application/json")) {
                        return response.json();
                    }
                    throw new TypeError("Oops, we haven't got JSON! ");
                }).then(function(json) {
                    if (json.message != null)
                        throw ('Message Error ' + json.message);

                    return json;
                }).then(function(json) {
                    console.log(JSON.stringify(json));
                    snackBar('Success ' + JSON.stringify(json));
                }).catch(function(error) {
                    snackBar('Error ' + error);
                });

                return true;
            });
        }

        function parseURI(address) {
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

        function createMessage(signature, pubKey, message) {
            return {
                uri: message,
                address: pubKey,
                signature: signature
            };
        }

        function getBitIDSiteURI(parsed) {
            return parsed.protocol + ":" + parsed.host + parsed.pathname;
        }

        function getSiteAddress(bitid) {
            const parsed = parseURI(bitid);
            const protocol = (parsed.unsecure != '') ? 'http://' : 'https://';
            return protocol + parsed.host;
        }

        function getCallBackURL(bitid) {
            return getSiteAddress(bitid) + parseURI(bitid).pathname;
        }

        function generateBITIDAddress(wif, site_uri) {

            const keyPair = Bitcoin.BitcoinJS.ECPair.fromWIF(wif);
            const phex = keyPair.d.toBuffer().toString('hex');
            const hd = Bitcoin.BitcoinJS.HDNode.fromSeedHex(phex);

            const sha256URL = Bitcoin.BitcoinJS.crypto.sha256(site_uri);
            const sha32uri = sha256URL.readInt32LE(1);

            const derived = hd.derivePath("m/0'/45342'/" + sha32uri + "/0");

            return derived;
        }

        function generateSignatureMessage(wif, address) {

            const parsed = parseURI(address);

            const site_uri = getBitIDSiteURI(parsed);
            const derived = generateBITIDAddress(wif, site_uri);
            const pubKeyAddress = derived.keyPair.getAddress();

            const message = parsed.href;

            // Sign the message
            const privateKey = derived.keyPair.d.toBuffer(32);
            const messagePrefix = Bitcoin.BitcoinJS.networks.bitcoin.messagePrefix;
            const signedMessage = Bitcoin.Message.sign(message, messagePrefix,
                privateKey, derived.keyPair.compressed);
            const signed = signedMessage.toString('base64');

            const fullMessage = createMessage(signed, pubKeyAddress, message);
            return fullMessage;
        }

        // =======================================================================
        // Tethering - Send a wallet one of our public keys. xpub format.
        // =======================================================================

        function tether(wif, parsed) {
            console.log('Tether ' + JSON.stringify(parsed));

            const xpubB58 = getHDWalletDeterministicKey(wif).neutered().toBase58();
            const callbackURL = parsed.post_back;
            const bitidURI = parsed.bitid;
            const reqObj = buildRequestMPKObject(xpubB58, bitidURI, parsed, wif);

            const formData = arrayToQueryParams(reqObj);

            console.log(formData);

            $('#tetheringModal').modal();

            $('#tetheringConfirm').click(function() {
                snackBar('Tethering');

                window.fetch(callbackURL, {
                    method: 'post',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                    },
                    body: formData
                }).then(function(responseText) {
                    console.log('Response from server ' + responseText);
                    snackBar('Success ' + responseText);
                }).catch(function(error) {
                    snackBar('Error ' + error);
                });

                return true;
            });
        }

        function parseCommand(href) {
            const params = href.split("|");
            var result = {};
            if (params.length >= 3) {
                result = {
                    cmd: params[0],
                    service: params[1],
                    post_back: params[2]
                };

                // Add in the extra paramters.
                for (var i = 4; i < params.length; i += 2) {
                    result[params[i - 1]] = params[i];
                }
            }
            return result;
        }

        function getHDWalletDeterministicKey(wif) {

            const keyPair = Bitcoin.BitcoinJS.ECPair.fromWIF(wif);
            const phex = keyPair.d.toBuffer().toString('hex');
            const hd = Bitcoin.BitcoinJS.HDNode.fromSeedHex(phex);

            const derivedByArgument = hd.derivePath("m/0");
            return derivedByArgument;
        }

        function buildRequestMPKObject(mpk, site_uri, parsed, wif) {
            // Clone the parsed results.
            var result = JSON.parse(JSON.stringify(parsed));
            // remove the suff we don't want to send back
            delete result['cmd'];
            delete result['service'];
            delete result['post_back'];
            result['mpk'] = mpk;

            // We add in a bit ID address so the user can use CarbonKey to login. 
            if (site_uri != undefined) {
                result['bitid_address'] = generateBITIDAddress(wif, site_uri).keyPair.getAddress();
            }
            return result;
        }

        function arrayToQueryParams(arr) {
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

        function signTransaction(wif, parsed) {

            const call_back = parsed.post_back + '?' + arrayToQueryParams(parsed);

            console.log('Signing Call Back ' + call_back);

            window.fetch(call_back).then(function(response) {
                return response.text().then(function(text) {

                    const signedSigList = signSigList(wif, text);

                    const requestParamters = buildSignRequest(signedSigList, parsed);
                    const formData = arrayToQueryParams(requestParamters);

                    console.log(formData);

                    // It's signed (Hopefully) send the signatures back.
                    window.fetch(call_back, {
                        method: 'post',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                        },
                        body: formData
                    }).then(function(response) {
                        return response.text().then(function(text) {

                            console.log('Response from server ' + text);
                            snackBar('Success ' + text);
                        });
                    }).catch(function(error) {
                        snackBar('Error ' + error);
                    });

                });

            }).catch(function(error) {
                snackBar('Error ' + error);
            });
        }

        function buildSignRequest(signedSigList, parsed) {
            // Clone the parsed results.
            var result = JSON.parse(JSON.stringify(parsed));
            // remove the suff we don't want to send back
            delete result['cmd'];
            delete result['service'];
            delete result['post_back'];
            result['meta_data'] = signedSigList;

            return result;
        }

        function signSigList(wif, transactionAndSigListText) {

            if (transactionAndSigListText.indexOf(':') == -1)
                throw ('Error, invalid Transaction');

            const sigList = JSON.parse(transactionAndSigListText.substring(
                transactionAndSigListText.indexOf(':') + 1,
                transactionAndSigListText.length));

            const pk = getHDWalletDeterministicKey(wif);
            return JSON.stringify(signSignatureList(pk.keyPair, sigList));
        }

        function signSignatureList(key, sig_list) {

            var address = key.getAddress();
            var full_address = key.getPublicKeyBuffer().toString('hex');

            for (var x = 0; x < sig_list.length; x++) {

                // Sometime the sig list has a full public address
                // sometimes a hashed address. We can sign for both.
                if (sig_list[x][address] != null) {
                    const hash = sig_list[x][address]['hash'];

                    const hash_buff = Bitcoin.Buffer.from(hash, 'hex');

                    const signed_hash = key.sign(hash_buff).toDER().toString("hex");

                    sig_list[x][address]['sig'] = signed_hash;

                } else if (sig_list[x][full_address] != null) {
                    const hash = sig_list[x][full_address]['hash'];

                    const hash_buff = Bitcoin.Buffer.from(hash, 'hex');

                    const signed_hash = key.sign(hash_buff).toDER().toString("hex");

                    sig_list[x][full_address]['sig'] = signed_hash;
                }
            }
            return sig_list;
        } */