import { Controller } from "stimulus"
import * as snackbar from 'node-snackbar'
import * as bip39 from "bip39"

export default class extends Controller {

  static targets = ['restoreWords']

  readonly restoreWordsTarget!: HTMLTextAreaElement

  connect() {
      console.log("Restore connected")
  }

  restore(e: MouseEvent) {
      console.log("Restore clicked")
      e.preventDefault()

      const words = this.restoreWordsTarget.value

      console.log(words)

      if (bip39.validateMnemonic(words)) {
          
          // Save the new key
          localStorage.setItem("seed_words", words);
          
          // Go home.
          document.getElementById('home-link').click()
      } else {
          snackbar.show({ text: 'Invalid Mnemonic', pos: 'bottom-center' })
      }
  }
}