import * as bitcoin from 'bitcoinjs-lib'
import * as bip32 from 'bip32'
import * as snackbar from 'node-snackbar'
import { getHDWallet, TetherRequest } from './util'
import { generateBITIDAddress } from './bitid'

// =======================================================================
// Tethering - Send a wallet one of our public keys. xpub format.
// =======================================================================

export function tether(ecpair: bitcoin.ECPairInterface, parsedQRCode: TetherRequest) {
  console.log('Tether ' + JSON.stringify(parsedQRCode));

  const xpubB58 = getHDWallet().neutered().toBase58();
  const callbackURL = parsedQRCode.postBack;
  const reqObj = buildRequestMPKObject(xpubB58, parsedQRCode, ecpair);

  const formData = arrayToQueryParams(reqObj);

  console.log(formData);
  console.log(callbackURL);

  snackbar.show({ text: 'Tethering', pos: 'bottom-center' })

  window.fetch(callbackURL, {
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    },
    body: formData
  }).then(function (responseText) {
    console.log('Response from server ' + JSON.stringify(responseText))
    snackbar.show({ text: JSON.stringify(responseText), pos: 'bottom-center' })
  }).catch(function (error) {
    snackbar.show({ text: 'Error ' + error, pos: 'bottom-center' })
  });
}

function buildRequestMPKObject(mpk: string, qrCommand: TetherRequest, ecpair: bitcoin.ECPairInterface) {
  // Clone the parsed results.
  var result = JSON.parse(JSON.stringify(qrCommand));
  // remove the suff we don't want to send back
  delete result['cmd'];
  delete result['service'];
  delete result['post_back'];
  result['mpk'] = mpk;

  const keyPair = generateBITIDAddress(ecpair, qrCommand.bitid)
  const addr = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey }).address!
  result['bitid_address'] = addr
  return result;
}

function arrayToQueryParams(arr) {
  var str = [];
  for (var p in arr)
    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(arr[p]));
  return str.join("&");
}