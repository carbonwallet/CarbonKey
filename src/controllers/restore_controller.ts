import { Controller } from "stimulus"

export default class extends Controller {

  static targets = ['restoreWords']

  readonly restoreWordsTarget!: HTMLTextAreaElement

  connect() {
      console.log("Restore connected")
  }

  restore(e: MouseEvent) {
      console.log("Restore clicked")
      e.preventDefault()
  }
}