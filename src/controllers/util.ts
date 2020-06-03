import * as bip39 from "bip39"
import * as bip32 from "bip32"

export function getHDWallet() : bip32.BIP32Interface {

    const seeds = window.localStorage.getItem('seed_words')
    console.log('>> ' + seeds)
    if (seeds != null) {
      const seedBuffer = bip39.mnemonicToSeedSync(seeds)
      const hd = bip32.fromSeed(seedBuffer)
      return hd.derivePath("m/0");
    }
}