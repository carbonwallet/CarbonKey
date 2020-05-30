import { Controller } from "stimulus"

export default class extends Controller {

  static targets = ['seed']

  readonly seedTarget!: HTMLHeadElement

  connect() {
      console.log("Backup connected")

      if(window.localStorage.getItem('seed_words') != null) {
        this.seedTarget.innerHTML = window.localStorage.getItem('seed_words')
      }
  }
}