import * as bitcoin from 'bitcoinjs-lib'
import * as snackbar from 'node-snackbar'

// =======================================================================
// Tethering - Send a wallet one of our public keys. xpub format.
// =======================================================================

export function tether(ecpair: bitcoin.ECPairInterface, parsed) {
  console.log('Tether ' + JSON.stringify(parsed));

  const xpubB58 = this.getHDWalletDeterministicKey(ecpair).neutered().toBase58();
  const callbackURL = parsed.post_back;
  const bitidURI = parsed.bitid;
  const reqObj = this.buildRequestMPKObject(xpubB58, bitidURI, parsed, ecpair);

  const formData = this.arrayToQueryParams(reqObj);

  console.log(formData);

  snackbar.show({ text: 'Tethering', pos: 'bottom-center' })

  window.fetch(callbackURL, {
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    },
    body: formData
  }).then(function (responseText) {
    console.log('Response from server ' + responseText);
    snackbar.show({ text: 'Response from server ' + responseText, pos: 'bottom-center' })
  }).catch(function (error) {
    snackbar.show({ text: 'Error ' + error, pos: 'bottom-center' })
  });
}