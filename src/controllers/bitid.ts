import * as snackbar from 'node-snackbar'
import * as bitcoin from 'bitcoinjs-lib'
import * as bitcoinMessage from 'bitcoinjs-message'
import * as bip32 from 'bip32'

export function processBITID(bitid_qr_code, ecpair: bitcoin.ECPairInterface) {

  console.log(bitid_qr_code);

  const msg = generateSignatureMessage(ecpair, bitid_qr_code);

  console.log(msg);

  snackbar.show({ text: 'Authenticating', pos: 'bottom-center' })

  window.fetch(getCallBackURL(bitid_qr_code), {
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
    snackbar.show({ text: 'Success ' + JSON.stringify(json), pos: 'bottom-center' })
  }).catch(function (error) {
    console.log(JSON.stringify(error));
    snackbar.show({ text: 'Error ' + error, pos: 'bottom-center' })
  });

  return true;
}

export function generateBITIDAddress(ecpair: bitcoin.ECPairInterface, site_uri: string) {

  var xpriv = bip32.fromSeed(ecpair.privateKey)

  const sha256URL = bitcoin.crypto.sha256(Buffer.from(site_uri, 'utf8'))
  const sha32uri = sha256URL.readInt32LE(1)

  const derived = xpriv.derivePath("m/0'/45342'/" + sha32uri + "/0")

  return derived;
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

function getSiteAddress(bitid: string) {
  const parsed = parseURI(bitid);
  const protocol = (parsed.unsecure != '') ? 'http://' : 'https://';
  return protocol + parsed.host;
}

function getCallBackURL(bitid) {
  return getSiteAddress(bitid) + parseURI(bitid).pathname;
}

function generateSignatureMessage(ecpair: bitcoin.ECPairInterface, address) {

  const parsed = parseURI(address);

  const site_uri = getBitIDSiteURI(parsed);
  const derived = generateBITIDAddress(ecpair, site_uri);
  const pubKeyAddress = bitcoin.payments.p2pkh({ pubkey: derived.publicKey }).address!

  const message = parsed.href;

  const signature = bitcoinMessage.sign(message, derived.privateKey, ecpair.compressed);

  const signed = signature.toString('base64');

  const fullMessage = createMessage(signed, pubKeyAddress, message);
  return fullMessage;
}