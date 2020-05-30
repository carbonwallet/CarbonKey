import { Controller } from "stimulus"
import * as bip39 from "bip39"
import * as snackbar from 'node-snackbar'

export default class extends Controller {

  static targets = ['about', 'home', 'backup', 'restore', 'scanner', 'menu']

  readonly aboutTarget!: HTMLDivElement
  readonly homeTarget!: HTMLDivElement
  readonly backupTarget!: HTMLDivElement
  readonly restoreTarget!: HTMLDivElement
  readonly scannerTarget!: HTMLDivElement
  readonly menuTarget!: HTMLDivElement

  connect() {
    if(window.localStorage.getItem("seed_words") != null) {

    } else {
      const mnemonic = bip39.generateMnemonic()
      console.log(mnemonic)
      window.localStorage.setItem('seed_words', mnemonic)
      snackbar.show({text: 'New Key created.', pos: 'bottom-center' })
    }
  }

  toggle() {
    this.menuTarget.classList.toggle('collapse')
  }

  resetUI() {
    this.homeTarget.style.display = 'none'
    this.aboutTarget.style.display = 'none'
    this.backupTarget.style.display = 'none'
    this.restoreTarget.style.display = 'none'
    this.scannerTarget.style.display = 'none'

    if(this.backupTarget.getAttribute('data-controller') != null) {
      this.backupTarget.removeAttribute('data-controller')
    }
  }

  home() {
    this.resetUI()
    this.homeTarget.style.display = 'block'
  }

  about() {
    this.resetUI()
    this.aboutTarget.style.display = 'block'
  }

  backup() {
    this.resetUI()
    this.backupTarget.setAttribute('data-controller', 'backup')
    this.backupTarget.style.display = 'block'
  }

  restore() {
    this.resetUI()
    this.restoreTarget.style.display = 'block'
  }

  scanner() {
    this.resetUI()
    this.scannerTarget.style.display = 'block'
  }
}

/**

        // Hide other pages and close the qr code reader if it's
        // open.
        function resetUI() {
            $('.page').hide();

            if (QRScanner.scannerIsRunning) {
                stopScanner();
                QRScanner.scannerIsRunning = false;
            }
        }

        function initHomePage() {
            resetUI();
            $('#home').show();
            $('#brand').text('Carbon Key');
        }

            $('#home-link').click(function() {

                initHomePage();

                return false;
            });

            // Make sure the home page intialises on startup.
            initHomePage();

            $('#backup-link').click(function() {
                resetUI();
                $('#backup').show();
                $('#brand').text('Backup');

                $('#backup-seed').html(CarbonKeyWallet.words);

                return false;
            });
            $('#restore-link').click(function() {

                resetUI();
                $('#restore').show();
                $('#brand').text('Restore');

                return false;
            });
            $('#about-link').click(function() {

                resetUI();
                $('#about-page').show();
                $('#brand').text('About');

                var bitid = 'bitid://carbonwallet.com/bitid_callback?x=b49984ec90fe0762';
                $('#bitid-address').text(
                    generateSignatureMessage(CarbonKeyWallet.wif, bitid).address);

                const xpub58 = getHDWalletDeterministicKey(CarbonKeyWallet.wif).neutered().toBase58();
                $('#xpub-address').text(xpub58.substr(xpub58.length - 8));

                $('#isIOS').text(isIOS());
                
                if (navigator.storage && navigator.storage.persist) { 
                    
                    navigator.storage.persisted().then(persistent => {
                        if (persistent)
                             $('#isAndroidPersistant').text("Active");
                    });
                }
                    
                if (window.matchMedia('(display-mode: standalone)').matches) {
                    $('#isAdded').text("Yes");
                }

                return false;
            });
            $('#scan-button').click(function() {
                $('.page').hide();
                $('#scanner').show();
                $('#brand').text('Scanner');

                startScanner();

                return false;
            }); */