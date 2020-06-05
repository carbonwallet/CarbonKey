import * as bip39 from "bip39"
import * as bip32 from "bip32"
import { processBITID } from './bitid'
import { signTransaction } from './signtx'
import { tether } from './tethering'
import * as bitcoin from 'bitcoinjs-lib'
import * as snackbar from 'node-snackbar'

export function getHDWallet(): bip32.BIP32Interface {

  const seeds = window.localStorage.getItem('seed_words')
  if (seeds != null) {
    const seedBuffer = bip39.mnemonicToSeedSync(seeds)
    const hd = bip32.fromSeed(seedBuffer)
    return hd.derivePath("m/0");
  }
}

function getECPair() {
  const seeds = window.localStorage.getItem('seed_words')
  if (seeds != null) {
    const seedBuffer = bip39.mnemonicToSeedSync(seeds)
    const hd = bip32.fromSeed(seedBuffer)
    return bitcoin.ECPair.fromPrivateKey(hd.privateKey)
  }
}

export interface SignRequest {
  cmd: string
}

export interface TetherRequest {
  cmd: string,
  // "service":"onchain.io"
  service: string
  // "postBack":"http://localhost:3000/tethering_callback"
  postBack: string
  // "nonce":"239da526490f1ee1"
  nonce: string
  // "bitid":"http://localhost:3000/bitid_callback"
  bitid: string
}

type Requests = SignRequest | TetherRequest;

// Decide what type of QR code this is i.e. BITID or transaction
// signing and process.
export function processQRCode(data: string) {

  const ecpair = getECPair();

  if (/^(bitid:).*$/.test(data) === true) {
    processBITID(data, ecpair);
  } else if (data.split("|").length > 3 === true) {

    var request: Requests = parseRequest(data);
    console.log('Command ' + request.cmd);

    switch (request.cmd) {
      case "mpk": tether(ecpair, request as TetherRequest)
      case "sign": signTransaction(ecpair, request)
    }

  } else {
    snackbar.show({ text: data, pos: 'bottom-center' })
  }
}

function parseRequest(href: string): TetherRequest | SignRequest | null {
  const params = href.split("|");
  if (params.length >= 3) {

    if (params[0] == 'mpk') {
      return {
        cmd: params[0],
        service: params[1],
        postBack: params[2],
        nonce: params[4],
        bitid: params[6]
      }
    } else if (params[0] = 'sign') {
      return {
        cmd: params[0]
      }
    }
  }
  return null;
}