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

# How does CarbonKey work?

All actions within CarbonKey are triggered by scanning a QR code. 

There are 3 main actions.

1. Registration and Login. Scan the QR code on a supporting site to register or login. No need to type passwords anymore. Your credentials are air gapped making them harder to steal.
2. Tethering. The wallet provider gets you to scan another QR code. This is a one time operation. CarbonKey will send a public key that the wallet provider can use to setup your wallet.
3. Transaction Signing. When you want to send out a payment the wallet provider with create another QR code for you to scan. CarbonKey with sign the transactions and your coins are released.

The private key never leaves CarbonKey.

To backup your CarbonKey write down the twelve word backup text on the backup page.


# How does CarbonKey work (More Technical)?

1. Registration and login are performed with the BitID protocol. https://github.com/bitid/bitid
2. Tethering. CarbonKey creates a HD wallet on ititialisation and sends an xpub key when requested.
3. Transaction signing. Inputs are retrieved from the wallet provider and signed via the HD wallet.

# Architecture

CarbonKey is purposely designed to have minimal dependencies and does not have a build process. The app is deloyed from our website or your own as a Progressive Web App (PWA). https://en.wikipedia.org/wiki/Progressive_web_app

# Notes for currencies looking to partner with CarbonWallet

CarbonKey was designed to be deployed easily by 3rd parties especially crypto currencies looking to partner with CarbonWallet. Crypto currency maintainers should audit the code and deploy under their own infrastructure.

This means that as a provider we are unable to touch your users keys even if our supply chain is completely compromised.

Let us do the job of onboarding customers and getting them familiar with multi signature wallets. You can feel safe knowing you can recommend to your currency holders an easy and safe way to store their crypto and invest in your technology.




