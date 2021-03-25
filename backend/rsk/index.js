const _ = require('lodash');
const { FAILED, PENDING, UNCONFIRMED, CONFIRMED, SIGNATURE_PENDING, MULTISIG_PENDING } = require('../../shared/status');
const { RBTC_TO_BTC } = require('../../shared/flows');
const abi = require('../../contracts/abi/FastSwap.abi.json');
const ordersModel = require('../models/orders');
const Web3 = require('web3');
const { sendLogAlert, sendNotificationAlert } = require('../utils/alerts');

require('dotenv').config();

const fastSwapAddress = process.env.FAST_SWAP_ADDRESS.toLowerCase();
const operatorAddress = process.env.FAST_SWAP_OPERATOR_ADDRESS;
const operatorPrivateKey = process.env.FAST_SWAP_OPERATOR_PRIV_KEY;

const AUTOMATIC_TX_THRESHOLD = process.env.AUTOMATIC_TX_THRESHOLD;
const MULTISIG_TX_THRESHOLD = process.env.MULTISIG_TX_THRESHOLD;

function getContract(web3) {
  const contract = new web3.eth.Contract(abi, fastSwapAddress);

  return contract;
}

async function getBlockNumber() {
  try {
    const web3Provider = new Web3.providers.HttpProvider(process.env.RSK_RPC);
    const web3 = new Web3(web3Provider);
    const blockNumber = await web3.eth.getBlockNumber();

    return blockNumber;
  } catch (error) {
    return -1;
  }
}

async function getTransactionReceipt(txId) {
  try {
    const web3Provider = new Web3.providers.HttpProvider(process.env.RSK_RPC);
    const web3 = new Web3(web3Provider);
    const receipt = await web3.eth.getTransactionReceipt(txId);

    return receipt;
  } catch (error) {
    console.log('[ERROR] getTransactionReceipt', error);

    return {};
  }
}

/**
 * Flow: BTC_TO_RBTC: cuando el usuario final recibe RBTC, previo depósito BTC.
 * @param {eth address} destiny string
 * @param {_amount netValue to transfer} string
 * @param {mongoID} _orderId string
 */
async function swapIn(destiny, _amount, _orderId) {
  return new Promise(async (resolve, reject) => {
    try {

      const web3Provider = new Web3.providers.HttpProvider(process.env.RSK_RPC);
      const web3 = new Web3(web3Provider);
      const contract = getContract(web3);
      const amount = web3.utils.toWei(_amount);
      const method = contract.methods.rbtcSwapIn(destiny, amount);
      const gas = await method.estimateGas({ from: operatorAddress });
      const gasPrice = await web3.eth.getGasPrice();
      const nonce = await web3.eth.getTransactionCount(operatorAddress, 'pending');
      const safeMarginGas = _.toInteger(gas * 0.1);

      const rawTx = {
        data: method.encodeABI(),
        from: operatorAddress,
        gas: web3.utils.toHex(gas + safeMarginGas),
        gasPrice: web3.utils.toHex(gasPrice),
        nonce: web3.utils.toHex(nonce),
        to: fastSwapAddress
      };

      if (_amount <= AUTOMATIC_TX_THRESHOLD) {

        const { rawTransaction } = await web3.eth.accounts.signTransaction(rawTx, operatorPrivateKey);

        web3.eth.sendSignedTransaction(rawTransaction, (error, hash) => {
          if (error) {
            console.log('Swapin error ', error);
            const msgToAlert = `Failed to execute rsk sawpIn() tx.\n OrderId: ${_orderId}\n To: ${destiny}\n Value: ${_amount}\n RawTx: ${rawTransaction}`;

            sendLogAlert(msgToAlert);

            return reject(error);
          }

          console.log(`[RBTCSwapIn->RSK] Tx Sent; hash: ${hash}`);

          let rawHexMsg = `[RBTCSwapIn->RSK] OrderId: ${_orderId}\nValue: ${_amount}\nStatus: UNCONFIRMED\n Tx Sent; hash: ${hash}`;
          sendNotificationAlert(rawHexMsg);

          resolve({ transactionHash: hash, txStatus: UNCONFIRMED, rawTransaction: rawTransaction });
        });

      } else if (_amount > AUTOMATIC_TX_THRESHOLD && _amount < MULTISIG_TX_THRESHOLD) {

        let rawHexMsg = `[RBTCSwapIn->RSK] OrderId: ${_orderId}\nValue: ${_amount}\nTo: ${destiny}\nStatus: SIGNATURE_PENDING`;

        sendNotificationAlert(rawHexMsg);

        resolve({ transactionHash: '', txStatus: SIGNATURE_PENDING, rawTransaction: rawTx });

      } else if (_amount >= MULTISIG_TX_THRESHOLD) {

        let rawHexMsg = `[RBTCSwapIn->RSK] OrderId: ${_orderId}\nValue: ${_amount}\nTo: ${destiny}\nStatus: MULTISIG_PENDING`;

        sendNotificationAlert(rawHexMsg);

        resolve({ transactionHash: '', txStatus: MULTISIG_PENDING, rawTransaction: rawTx });
      }


    } catch (error) {
      const errorMessage = `[ERROR] On Create signed transaction. ${error}`;

      console.log(errorMessage);

      sendLogAlert(errorMessage)

      reject(error);
    }
  });
}

/**
 * Function to replace socket event Watch.
 */
async function processSwapOut() {
  try {

    let filter = {
      flow: RBTC_TO_BTC,
      'rsk.status': PENDING,
      deleted: false
    };

    const orders = await ordersModel.countDocuments(filter);

    /**
     * Si no hay ordenes RBTC_TO_BTC no tiene sentido buscar getPastLogs()
     * hago return;
     */
    if (orders <= 0)
      return;

    /**
     * Inicializo web3 por RPC
     */
    const web3Provider = new Web3.providers.HttpProvider(process.env.RSK_RPC);
    const web3 = new Web3(web3Provider);
    const contract = getContract(web3);
    const latestBlock = await web3.eth.getBlockNumber();

    /**
     * RSK bloque promedio cada 30 segundos
     * Busco 240 bloques atrás ~ 2h
     */
    const PAST_BLOCKS = 240;
    const searchFromBlock = latestBlock - PAST_BLOCKS;

    const pastEvents = await contract.getPastEvents('RBTCSwapOut', {
      fromBlock: searchFromBlock,
      toBlock: 'latest'
    });

    /**
     * Si el nodo falla y devuelve un array vacio con los eventos, retorno y espero la próxima vuelta.
     */
    if (pastEvents.length == 0)
      return;

    pastEvents.forEach(async (event) => {
      const { source: senderAddress, amount: value } = _.get(event, 'returnValues', {});
      const amount = web3.utils.fromWei(value);
      const blockNumber = _.get(event, 'blockNumber');
      const transactionHash = _.get(event, 'transactionHash');

      const checkifTxExist = await ordersModel.findOne({
        'rsk.txId': transactionHash,
        deleted: false,
        flow: RBTC_TO_BTC
      });

      if (checkifTxExist != null) {
        console.log(`[RBTCSwapOut]txId ${transactionHash} already saved, ignoring`);
        return;
      }

      const order = await ordersModel.findOne({
        'rsk.status': PENDING,
        'rsk.senderAddress': {
          $regex: new RegExp(senderAddress, 'i')
        },
        deleted: false,
        flow: RBTC_TO_BTC
      });

      if (_.isEmpty(order)) {
        console.log(`[+] No order found corresponding to senderAddress: ${senderAddress}, ignoring ...`);
      } else {
        if (amount < order.value) {
          console.log(`[RBTCSwapOut] Order ${order._id}: sent less value than needed.\n`);

          order.rsk.status = FAILED;

          let _msg = `Address ${senderAddress} sent ${amount} and ${order.value} expected. Marking rsk.status as failed.`

          sendLogAlert(_msg);
        } else {
          console.log(`[RBTCSwapOut] Order ${order._id}: Value transfered is correct, saving order new status: UNCONFIRMED`);

          order.rsk.block = blockNumber;
          order.rsk.status = UNCONFIRMED;
          order.rsk.txId = transactionHash;
        }

        await order.save();
      }
    });
  } catch (error) {
    console.log(error)
  }
}

module.exports = {
  getBlockNumber,
  getTransactionReceipt,
  processSwapOut,
  swapIn
};
