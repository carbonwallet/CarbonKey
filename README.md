# CarbonKey

CarbonKey is used in conjuction with Carbon Wallet https://carbonwallet.com to create secure 2 of 2 multi signature bitcoin wallets where you are in charge of your private keys.

<table>
<tr>
<td><img src="https://raw.githubusercontent.com/onchain/CarbonKey/master/img/images_for_readme/main-screen.png" width="95%"></td>
<td><img src="https://raw.githubusercontent.com/onchain/CarbonKey/master/img/images_for_readme/backup.png" width="95%"></td>
<td><img src="https://raw.githubusercontent.com/onchain/CarbonKey/master/img/images_for_readme/backup-recovery.png" width="95%"></td>
<td><img src="https://raw.githubusercontent.com/onchain/CarbonKey/master/img/images_for_readme/bitid.png" width="95%"></td>
</tr>
</table>

# What does CarbonKey do?

Trust is the main issue with crypto currency wallets these days. We have to trust the wallet provider both from an integrity standpoint and that they are capable of securing their infrastructure.

Most crypto currencies come with multi signature built into the software but few wallets are using this feature.

CarbonKey is designed to take advantage of the multi signature infrastructure in place and provide a verifiable secure code base. Wallets that support the CarbonKey protocol are more as at least one private key is not controlled by the wallet provider.

Currently CarbonWallet https://carbonwallet.com is the only wallet supporting multi signature wallets secured with CarbonKey.

# Debugging

From the browser console the following are useful.

injector = angular.element(document.body).injector()

onchain = injector.get('onChainService')

bitid = injector.get('bitIDService')

You can then call the various methods on the services.

Test BIT ID

var succ = function(data) { alert('Success ' + data) };
var fail = function(data) { alert(data) };
uri = 'bitid://carbonwallet.com/bitid_callback?x=9c70553e8d982e22'
bitid.setAddress(uri)
bitid.authorize(window.localStorage.getItem("wif"), succ, fail);


