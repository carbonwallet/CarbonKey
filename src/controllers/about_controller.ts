import { Controller } from "stimulus"
import * as bip39 from "bip39"
import * as bip32 from "bip32"
import * as bitcoin from 'bitcoinjs-lib'

export default class extends Controller {

  static targets = ['bitidAddress', 'xpubAddress', 'isIOS', 'isAndroidPersistant', 'isAdded']

  readonly bitidAddressTarget!: HTMLParagraphElement
  readonly xpubAddressTarget!: HTMLParagraphElement
  readonly isIOSTarget!: HTMLParagraphElement
  readonly isAndroidPersistantTarget!: HTMLParagraphElement
  readonly isAddedTarget!: HTMLParagraphElement

  connect() {
    console.log("About connected")


    const seeds = window.localStorage.getItem('seed_words')
    if (seeds != null) {
      const seedBuffer = bip39.mnemonicToSeedSync(seeds)
      const hd = bip32.fromSeed(seedBuffer)
  
      const derivedByArgument = hd.derivePath("m/0");

      const xpub58 = derivedByArgument.neutered().toBase58()
      this.xpubAddressTarget.innerText = xpub58.substr(xpub58.length - 8)
    }
  }
}