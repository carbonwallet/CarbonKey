import * as bitcoin from 'bitcoinjs-lib'
import * as bip32 from 'bip32'
import * as snackbar from 'node-snackbar'
import { getHDWallet } from './util'

// =======================================================================
// Tethering - Send a wallet one of our public keys. xpub format.
// =======================================================================

export function tether(ecpair: bitcoin.ECPairInterface, parsed) {
  console.log('Tether ' + JSON.stringify(parsed));

  const xpubB58 = getHDWallet().neutered().toBase58();
  const callbackURL = parsed.postBack;
  const bitidURI = parsed.bitid;
  const reqObj = buildRequestMPKObject(xpubB58, bitidURI, parsed, ecpair);

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

function buildRequestMPKObject(mpk, site_uri, parsed, ecpair: bitcoin.ECPairInterface) {
  // Clone the parsed results.
  var result = JSON.parse(JSON.stringify(parsed));
  // remove the suff we don't want to send back
  delete result['cmd'];
  delete result['service'];
  delete result['post_back'];
  result['mpk'] = mpk;

  // We add in a bit ID address so the user can use CarbonKey to login.
  if (site_uri != undefined) {

    const keyPair = generateBITIDAddress(ecpair, site_uri)
    const addr = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey }).address!
    result['bitid_address'] = addr
  }
  return result;
}

function arrayToQueryParams(arr) {
  var str = [];
  for (var p in arr)
    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(arr[p]));
  return str.join("&");
}

function generateBITIDAddress(ecpair: bitcoin.ECPairInterface, site_uri) {

  var xpriv = bip32.fromSeed(ecpair.privateKey)

  const sha256URL = bitcoin.crypto.sha256(site_uri);
  const sha32uri = sha256URL.readInt32LE(1);

  const derived = xpriv.derivePath("m/0'/45342'/" + sha32uri + "/0");

  return derived;
}