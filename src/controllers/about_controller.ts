import { Controller } from "stimulus"
import { getHDWallet } from './util'

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
}