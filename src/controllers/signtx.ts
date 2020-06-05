import * as bitcoin from 'bitcoinjs-lib'
import * as snackbar from 'node-snackbar'

// =======================================================================
// Transaction Signing.
// 1. Get the transaction from Carbon Wallet
// 2. Sign the inputs
// 3. Send the signatures back.
// =======================================================================

export function signTransaction(ecpair: bitcoin.ECPairInterface, parsed) {

  const call_back = parsed.post_back + '?' + this.arrayToQueryParams(parsed);

  console.log('Signing Call Back ' + call_back);

  window.fetch(call_back).then(function (response) {
    return response.text().then(function (text) {

      const signedSigList = this.signSigList(ecpair, text);

      const requestParamters = this.buildSignRequest(signedSigList, parsed);
      const formData = this.arrayToQueryParams(requestParamters);

      console.log(formData);

      // It's signed (Hopefully) send the signatures back.
      window.fetch(call_back, {
        method: 'post',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: formData
      }).then(function (response) {
        return response.text().then(function (text) {

          console.log('Response from server ' + text);
          snackbar.show({ text: 'Success ' + text, pos: 'bottom-center' })
        });
      }).catch(function (error) {
        snackbar.show({ text: 'Error ' + error, pos: 'bottom-center' })
      });

    });

  }).catch(function (error) {
    snackbar.show({ text: 'Error ' + error, pos: 'bottom-center' })
  });
}

function buildSignRequest(signedSigList, parsed) {
  // Clone the parsed results.
  var result = JSON.parse(JSON.stringify(parsed));
  // remove the suff we don't want to send back
  delete result['cmd'];
  delete result['service'];
  delete result['post_back'];
  result['meta_data'] = signedSigList;

  return result;
}

function signSigList(ecpair: bitcoin.ECPairInterface, transactionAndSigListText) {

  if (transactionAndSigListText.indexOf(':') == -1)
    throw ('Error, invalid Transaction');

  const sigList = JSON.parse(transactionAndSigListText.substring(
    transactionAndSigListText.indexOf(':') + 1,
    transactionAndSigListText.length));

  return JSON.stringify(this.signSignatureList(ecpair, sigList));
}

function signSignatureList(key: bitcoin.ECPairInterface, sig_list) {

  const address = bitcoin.payments.p2pkh({ pubkey: key.publicKey }).address!
  var full_address = key.publicKey.toString('hex');

  for (var x = 0; x < sig_list.length; x++) {

    // Sometime the sig list has a full public address
    // sometimes a hashed address. We can sign for both.
    if (sig_list[x][address] != null) {
      const hash = sig_list[x][address]['hash'];

      const hash_buff = Buffer.from(hash, 'hex');

      const signed_hash = key.sign(hash_buff)
      const sigDer = bitcoin.script.signature.encode(signed_hash, 1)
      const sigWithoutHash = sigDer.slice(0, sigDer.length - 1);

      sig_list[x][address]['sig'] = sigWithoutHash;

    } else if (sig_list[x][full_address] != null) {
      const hash = sig_list[x][full_address]['hash'];

      const hash_buff = Buffer.from(hash, 'hex');

      const signed_hash = key.sign(hash_buff)
      const sigDer = bitcoin.script.signature.encode(signed_hash, 1)
      const sigWithoutHash = sigDer.slice(0, sigDer.length - 1);

      sig_list[x][full_address]['sig'] = sigWithoutHash;
    }
  }
  return sig_list;
}