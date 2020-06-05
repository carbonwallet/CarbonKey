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

interface Command {
  cmd: string
  service: string
  postBack: string
}

// Decide what type of QR code this is i.e. BITID or transaction
// signing and process.
export function processQRCode(data: string) {

  const seeds = window.localStorage.getItem('seed_words')
  if (seeds != null) {
    const seedBuffer = bip39.mnemonicToSeedSync(seeds)
    const hd = bip32.fromSeed(seedBuffer)
    const ecpair = bitcoin.ECPair.fromPrivateKey(hd.privateKey)

    if (/^(bitid:).*$/.test(data) === true) {
      processBITID(data, ecpair);
    } else if (data.split("|").length > 3 === true) {
      var parsed = parseCommand(data);
      console.log('Command ' + parsed.cmd);
      if (parsed.cmd == 'mpk') {
        tether(ecpair, parsed);
      }
      if (parsed.cmd == 'sign') {
        signTransaction(ecpair, parsed);
      }
    } else {
      snackbar.show({ text: data, pos: 'bottom-center' })
    }
  }
}

function parseCommand(href: string): Command | null {
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