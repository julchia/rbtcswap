require('dotenv').config();
const addressesModel = require('../models/addresses');
const bip32 = require('bip32');
const bitcoinjs = require('bitcoinjs-lib');
const Web3 = require('web3');
const { connect } = require('./electrumx');
const { getBlockchainEnv } = require('./environments');

const M_OF_N = Number(process.env.BTC_MULTISIG_M);

const NETWORK = getBlockchainEnv();

const XPUB1 = process.env.BTC_MULTISIG_XPUB1;
const XPUB2 = process.env.BTC_MULTISIG_XPUB2;
const XPUB3 = process.env.BTC_MULTISIG_XPUB3;
const XPUB4 = process.env.BTC_MULTISIG_XPUB4;

/*
  Based on BIP-67 pubkeys must be lexographically sorted to create the multisig redeem script
  See: https://github.com/bitcoin/bips/blob/master/bip-0067.mediawiki
*/
function sortBuffers(bufArr) {
  return bufArr.sort(Buffer.compare);
}

/**
 * Validates any address, including legacy, p2sh and bech32
 * @param address
 * @returns {boolean}
 */
function isAddressValid(address, _network) {
  try {
    bitcoinjs.address.toOutputScript(address, _network);
    return true;
  } catch (e) {
    return false;
  }
}


/*
  Get the next addr derivation path by checking the length of total addresses document found on MongoDB
*/
async function getAddrNextIndex() {
  let addresses = await addressesModel.find();
  return addresses.length == 0 ? 0 : addresses.length + 1;
}

function deriveAddrByIndex(_index) {

  let arr = [];

  arr[0] = bitcoinjs.payments.p2pkh({
    pubkey: bip32.fromBase58(XPUB1, NETWORK)
      .derive(0)
      .derive(_index)
      .publicKey,
  }, NETWORK).pubkey;

  arr[1] = bitcoinjs.payments.p2pkh({
    pubkey: bip32.fromBase58(XPUB2, NETWORK)
      .derive(0)
      .derive(_index)
      .publicKey,
  }, NETWORK).pubkey;

  if (process.env.BLOCKCHAIN_ENV != 'testnet') {

    arr[2] = bitcoinjs.payments.p2pkh({
      pubkey: bip32.fromBase58(XPUB3, NETWORK)
        .derive(0)
        .derive(_index)
        .publicKey,
    }, NETWORK).pubkey;

    arr[3] = bitcoinjs.payments.p2pkh({
      pubkey: bip32.fromBase58(XPUB4, NETWORK)
        .derive(0)
        .derive(_index)
        .publicKey,
    }, NETWORK).pubkey;

  }

  let addr = bitcoinjs.payments.p2sh({
    redeem: bitcoinjs.payments.p2ms({
      m: M_OF_N, pubkeys: sortBuffers(arr), network: NETWORK
    }),
  }, NETWORK).address
  return addr;
}

/**
 * Returns address balance in BTC
 * @param {base58 Bitcoin address} _address string
 */
async function getBTCAddressBalance(_address) {

  const BTC_UNIT = 100000000;

  if (!isAddressValid(_address, NETWORK))
    throw "Invalid Address";

  try {

    let client = await connect();
    const script = bitcoinjs.address.toOutputScript(_address, NETWORK);
    const hash = bitcoinjs.crypto.sha256(script);
    const reversedHash = new Buffer.from(hash.reverse());
    const rScriptHash = reversedHash.toString('hex');

    let balance = await client.blockchain_scripthash_getBalance(rScriptHash);

    await client.close();

    return balance.confirmed / BTC_UNIT;

  } catch (error) {
    console.log(error);
    return error;
  }

}


/**
 * Returns Address balance in ETH.
 * @param {RSK/ETH address} _addr String
 */
async function getRSKAddressBalance(_addr) {

  try {
    const web3Provider = new Web3.providers.HttpProvider(process.env.RSK_RPC);
    const web3 = new Web3(web3Provider);
    let balance = await web3.eth.getBalance(_addr);
    return web3.utils.fromWei(balance);
  } catch (error) {
    console.log(error);
    return -1;
  }
}

module.exports = {
  deriveAddrByIndex,
  getBTCAddressBalance,
  getRSKAddressBalance,
  getAddrNextIndex,
  isAddressValid,
  sortBuffers
};

