const _ = require('lodash');
const { connect } = require('./electrumx');
const axios = require('axios');
const bitcoinjs = require('bitcoinjs-lib');
const coinSelect = require('coinselect');

require('dotenv').config();

/**
 * Get feeRate in Satothis to calculate total fee
 */
async function getFeeRates() {
  try {
    let feeRate;
    let binfoFees = await axios.get('https://bitcoinfees.earn.com/api/v1/fees/recommended');
    feeRate = binfoFees.data.fastestFee;
    return feeRate;
  } catch (error) {
    return error;
  }
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


/**
 * 
 * @param {address from send funds} _FROM base58
 * @param {adress(s)  to send} _TO base58
 * @param {value to send} _VALUE integer in SATS
 * @param {testnet|mainnet} _NETWORK string
 */
async function createUnsignedRawtx(_FROM, _TO, _VALUE, _NETWORK) {

  try {


    if (!_NETWORK)
      throw "Missing network definition";

    if (!_FROM || !_TO || !_VALUE)
      throw "Missing Parameters";

    if (!isAddressValid(_FROM, _NETWORK) || !isAddressValid(_TO, _NETWORK))
      throw "Invalid Address";

    let client = await connect();

    const script = bitcoinjs.address.toOutputScript(_FROM, _NETWORK);
    const hash = bitcoinjs.crypto.sha256(script);
    const reversedHash = new Buffer.from(hash.reverse());
    const rScriptHash = reversedHash.toString('hex');

    const UTXOs = await client.blockchain_scripthash_listunspent(rScriptHash);

    let feeRate = await getFeeRates();

    if (!feeRate)
      throw "Unable to fetch fee rates, aborting";

    let proccessedUTXOs = [];
    let bufferRawTx;

    await Promise.all(UTXOs.map(async (i) => {

      bufferRawTx = Buffer.from(await client.blockchain_transaction_get(i.tx_hash), 'hex');

      proccessedUTXOs.push({
        txId: i.tx_hash,
        vout: i.tx_pos,
        value: i.value,
        nonWitnessUtxo: bufferRawTx
      })
    }));

    let targets = [
      {
        address: _TO,
        value: _VALUE
      }
    ];

    let { inputs, outputs, fee } = coinSelect(proccessedUTXOs, targets, feeRate);

    if (!inputs || !outputs)
      throw "No coin selection solution found; check if enough balance"

    let psbt = new bitcoinjs.Psbt({ network: _NETWORK });

    inputs.forEach(input =>
      psbt.addInput({
        hash: input.txId,
        index: input.vout,
        nonWitnessUtxo: input.nonWitnessUtxo,
        // OR (not both)
        //witnessUtxo: input.witnessUtxo,
      })
    )

    outputs.forEach(output => {
      // watch out, outputs may have been added that you need to provide
      // an output address/script for
      if (!output.address)
        output.address = _FROM;//CHANGE_ADDRESS

      psbt.addOutput({
        address: output.address,
        value: output.value,
      })
    });

    let unsignedRawTx = {
      inputs: inputs,
      outputs: outputs,
      fees: fee,
      rawTx: psbt.toHex(),
    }
    await client.close();
    return unsignedRawTx;

  } catch (error) {
    console.log(error);
    return error;
  }

}

/**
 * 
 * @param {base58 addr} _FROM string
 * @param {base58 addr} _TO string
 * @param {target value in SATOSHIS} _VALUE integer
 * @param {bitcoinlib-js keypair format} _KEYPAIR object
 * @param {testnet|mainnet} _NETWORK string
 */
async function createAndSignTx(_FROM, _TO, _VALUE, _KEYPAIR, _NETWORK) {

  try {

    if (!_NETWORK)
      throw "Missing network definition";

    if (!_FROM || !_TO || !_VALUE)
      throw "Missing Parameters";

    let network = _NETWORK;

    if (!isAddressValid(_FROM, network) || !isAddressValid(_TO, network))
      throw "Invalid Address";


    let client = await connect();

    const script = bitcoinjs.address.toOutputScript(_FROM, network);
    const hash = bitcoinjs.crypto.sha256(script);
    const reversedHash = new Buffer.from(hash.reverse());
    const rScriptHash = reversedHash.toString('hex');

    const UTXOs = await client.blockchain_scripthash_listunspent(rScriptHash);

    let feeRate = await getFeeRates();

    if (!feeRate)
      throw "Unable to fetch fee rates, aborting";

    let proccessedUTXOs = [];
    let bufferRawTx;

    await Promise.all(UTXOs.map(async (i) => {

      bufferRawTx = Buffer.from(await client.blockchain_transaction_get(i.tx_hash), 'hex');

      proccessedUTXOs.push({
        txId: i.tx_hash,
        vout: i.tx_pos,
        value: i.value,
        nonWitnessUtxo: bufferRawTx
      })
    }));

    let targets = [
      {
        address: _TO,
        value: _VALUE
      }
    ];

    let { inputs, outputs, fee } = coinSelect(proccessedUTXOs, targets, feeRate);


    if (!inputs || !outputs)
      throw "No coin selection solution found; check if enough balance"

    let psbt = new bitcoinjs.Psbt({ network: network });

    inputs.forEach(input =>
      psbt.addInput({
        hash: input.txId,
        index: input.vout,
        nonWitnessUtxo: input.nonWitnessUtxo,
        // OR (not both)
        //witnessUtxo: input.witnessUtxo,
      })
    )

    outputs.forEach(output => {
      // watch out, outputs may have been added that you need to provide
      // an output address/script for
      if (!output.address)
        output.address = _FROM;//CHANGE_ADDRESS

      psbt.addOutput({
        address: output.address,
        value: output.value,
      })
    });

    psbt.signAllInputs(_KEYPAIR);
    psbt.finalizeAllInputs();

    let rawSignedTx = psbt.extractTransaction().toHex();

    let signedRawTx = {
      inputs: inputs,
      outputs: outputs,
      fees: fee,
      size: Buffer.byteLength(rawSignedTx, 'hex') + " bytes",
      signedRawTx: rawSignedTx
    }

    await client.close();
    return signedRawTx;

  } catch (error) {
    console.log(error);
    return error;
  }

}
/**
 * 
 * @param {complete raw tx to relay in hex} hexTx hex
 */
async function relaySignedTx(hexTx) {

  try {
    let client = await connect();

    if (!hexTx)
      throw "Missing rawHexTx parameter";

    let broadcastResult = await client.blockchain_transaction_broadcast(hexTx);
    await client.close();
    return broadcastResult;

  } catch (error) {
    console.log(error);
    return;
  }

};

/**
 * Function to get txId status, used to get confirmations
 * @param {transaction hash id} txId string
 */
async function getTxInfo(txId) {

  if (!txId)
    return "Missing txId (hash) parameter";

  try {

    let client = await connect();
    let txInformation = await client.blockchain_transaction_get(txId, true);

    await client.close();

    return txInformation;

  } catch (error) {
    console.log(error);
    return error;
  }

}

async function getBTCTxConfirmations(txId) {

  try {

    if (!txId)
      return "Missing txId (hash) parameter";

    console.log(`Getting confirmations for tx: ${txId}`);

    let client = await connect();
    let txInformation = await client.blockchain_transaction_get(txId, true);
    let confirmations = _.get(txInformation, 'confirmations', 0);

    await client.close();

    return confirmations;

  } catch (error) {
    console.log(error);
    return error;
  }
}

async function checkIfPendingTXs(_HOT_WALLET, _NETWORK) {

  try {

    if (!_NETWORK)
      throw "Missing network definition";

    if (!_HOT_WALLET)
      throw "Missing address parameter";

    if (!isAddressValid(_HOT_WALLET, _NETWORK))
      throw "Invalid address";

    let client = await connect();

    const script = bitcoinjs.address.toOutputScript(_HOT_WALLET, _NETWORK);
    const hash = bitcoinjs.crypto.sha256(script);
    const reversedHash = new Buffer.from(hash.reverse());
    const rScriptHash = reversedHash.toString('hex');

    const pendingtxs = await client.blockchain_scripthash_getMempool(rScriptHash);

    client.close();

    if (pendingtxs.length > 0)
      return true;
    else
      return false;

  } catch (error) {
    console.log(`[checkIfPendingTXs] Error: ${error.message}`);
    return true;
  }
}

async function validateTxId(txId) {
  try {
    const client = await connect();
    const tx = await client.blockchain_transaction_get(txId, true);

    await client.close();

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

module.exports = {
  createUnsignedRawtx: createUnsignedRawtx,
  createAndSignTx: createAndSignTx,
  relaySignedTx: relaySignedTx,
  getTxInfo: getTxInfo,
  getBTCTxConfirmations: getBTCTxConfirmations,
  checkIfPendingTXs: checkIfPendingTXs,
  validateTxId: validateTxId
}
