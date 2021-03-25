const _ = require('lodash');
const { BTC_TO_RBTC, RBTC_TO_BTC } = require('../../shared/flows');
const { BTC, RSK } = require('../../shared/chains');
const { CONFIRMED, FAILED, UNCONFIRMED, SIGNATURE_PENDING, MULTISIG_PENDING, PENDING } = require('../../shared/status');
const { createAndSignTx, getBTCTxConfirmations, relaySignedTx, createUnsignedRawtx, checkIfPendingTXs, validateTxId } = require('../utils/transaction');
const { getBlockHeight } = require('../utils/block-height');
const { sendLogAlert, sendNotificationAlert } = require('../utils/alerts');
const { getTransactionReceipt } = require('../rsk/index');
const { swapIn } = require('../rsk/index');
const { unwatchAddress } = require('../utils/blocknative');
const { getBlockchainEnv } = require('../utils/environments');
const bitcoinjs = require('bitcoinjs-lib');
const blocksModel = require('../models/blocks');
const ordersModel = require('../models/orders');

require('dotenv').config();
const network = getBlockchainEnv();

const BTC_BLOCK_HEIGHT_CONFIRMATION = getBlockHeight(BTC);
const RSK_BLOCK_HEIGHT_CONFIRMATION = getBlockHeight(RSK);

const AUTOMATIC_TX_THRESHOLD = process.env.AUTOMATIC_TX_THRESHOLD;
const MULTISIG_TX_THRESHOLD = process.env.MULTISIG_TX_THRESHOLD;

async function btcWithdraw(order) {

  /* 
  AUTOMATIC_THRESHOLD <= 0.02
  MANUAL_THRESHOLD > 0.02 && MANUAL_THRESHOLD <= 0.1
  MULTISIG_THRESHOLD > 0.1
*/
  const BTC_UNIT = 100000000;

  /**
   * Calculo con netValue de la orden que ya tiene descontados los fees.
   */
  let _NET_VALUE_BTC = order.netValue;
  let _NET_VALUE_SATS = _NET_VALUE_BTC * BTC_UNIT;

  let _TO = order.btc.address;

  /**
   * Si el valor total de la orden es menor o igual a AUTOMATIC_TX_THRESHOLD se puede hacer la
   * firma y relay automático de la tx
   */
  if (_NET_VALUE_BTC <= AUTOMATIC_TX_THRESHOLD) {

    try {

      /**
     * Espero que no haya transacciones pendientes para que no haya UTXO en mempool.
     */

      const existTxInMempool = await checkIfPendingTXs(process.env.BTC_HOT_WALLET_ADDR, network);

      if (existTxInMempool) {
        console.log(`[RBTCSwapOut->BTC] still unconfirmed txs from ${process.env.BTC_HOT_WALLET_ADDR}, waiting next cycle.`);
        return;
      }

      /**
       * Uso la HOT_WALLET definida en .ENV como origen de los fondos.
       */
      let _FROM = process.env.BTC_HOT_WALLET_ADDR;
      let _PRIVKEY = process.env.BTC_HOT_WALLET_PRIVKEY;

      const RSKKeypair = bitcoinjs.ECPair.fromWIF(
        _PRIVKEY,
        network
      );

      let createdSignedTx = await createAndSignTx(_FROM, _TO, _NET_VALUE_SATS, RSKKeypair, network);

      if (!createdSignedTx.signedRawTx) {
        console.log(createdSignedTx);
        throw 'Error creating signedRawTx';
      }

      let broadcastedTxId = await relaySignedTx(createdSignedTx.signedRawTx);

      if (!broadcastedTxId) {
        console.log(broadcastedTxId);
        throw 'Error broadcasting transaction';
      }

      order.btc.txId = broadcastedTxId;
      order.btc.status = UNCONFIRMED;

      let depositMsg = `[RBTCSwapOut->BTC] Order: ${order._id}\nTo: ${_TO}\nValue: ${order.netValue} BTC\nTxId: ${order.btc.txId}\nAutomatically sent.`;

      sendNotificationAlert(depositMsg);

    } catch (error) {
      console.log(error);
      order.btc.status = FAILED;
      sendLogAlert(`[RBTCSwapOut->BTC] Order: ${order._id}\nError: ${error}`);
      throw ("Error creating or relaying signed transaction")
    }

    /**
     * Source HOT_WALLET pero previo review y firma.
     */
  } else if (_NET_VALUE_BTC > AUTOMATIC_TX_THRESHOLD && _NET_VALUE_BTC < MULTISIG_TX_THRESHOLD) {

    try {

      let _FROM = process.env.BTC_HOT_WALLET_ADDR;

      let unsignedRawHexTx = await createUnsignedRawtx(
        _FROM,
        _TO,
        _NET_VALUE_SATS,
        network
      );

      order.btc.status = SIGNATURE_PENDING;
      order.btc.unsignedRawHexTx = unsignedRawHexTx;

      /**
       * Disparar alerta a grupo Telegram con:
       * order.btc.status
       * order.netValue
       * unsignedRawHexTx.rawTx;
       */

      let rawHexMsg = `[RBTCSwapOut->BTC] Order: ${order._id}\nStatus: ${order.btc.status}\nSend To: ${_TO}\nValue: ${order.netValue} BTC\nReady to sign from HOT_WALLET\nrawHexTx: ${unsignedRawHexTx.rawTx}`;

      sendNotificationAlert(rawHexMsg);
    } catch (error) {
      console.log(error);
      order.btc.status = FAILED;
      sendLogAlert("[RBTCSwapOut->BTC] Error creating unsignedRawTx");
      throw ("Error creating unsignedRawTx");
    }

    /**
     * Si el order.value es mayor a MULTISIG_TX_THRESHOLD entonces directamente tiene que pasar por multisig.
     */
  } else if (_NET_VALUE_BTC >= MULTISIG_TX_THRESHOLD) {

    /**
     * 
     * Se dispara alerta en Telegram y se maneja desde adentro de 
     */
    order.btc.status = MULTISIG_PENDING;

    let multisigTxMsg = `[RBTCSwapOut->BTC] Order: ${order._id}\nStatus: ${order.btc.status}\nSend To: ${_TO}\nValue: ${order.netValue} BTC\n Ready to sign from MULTISIG COSIGNERS\n`;

    sendNotificationAlert(multisigTxMsg);

  }//else if multiSig

}

async function checkConfirmations(chain, height, heightConfirmation, order) {
  // El block delta en -1 es para cuando no está definido el block en una chain.
  const blockDelta = order[chain].block ? height - order[chain].block : -1;
  const status = (blockDelta >= heightConfirmation) ? CONFIRMED : order[chain].status;

  if (order[chain].status !== CONFIRMED && status === CONFIRMED) {
    if (order.flow === BTC_TO_RBTC) {
      if (chain === BTC && _.isEmpty(order.rsk.txId)) {

        order.btc.status = CONFIRMED;

        console.log(`Confirmed BTC tx ${order.btc.txId}`);
        console.log(`Order Id: ${order._id}`);
        console.log(`Flow: ${BTC_TO_RBTC}`);

        unwatchAddress(order.btc.address);

        try {

          /**
           * Envio netValue: el usuario recibe del lado de RSK el valor de la orden menos el fee de operación.
           */
          const { transactionHash, txStatus, rawTransaction } = await swapIn(order.rsk.address, order.netValue, order._id);

          order.rsk.txId = transactionHash;
          order.rsk.status = txStatus;
          order.rsk.rawTransaction = rawTransaction;

          if (txStatus == "failed") {
            let errorMsg = `Contract reverted Tx Id: ${transactionHash}; Status: ${txStatus}`;
            console.log(errorMsg);
            sendLogAlert(errorMsg)
          }


        } catch (error) {
          console.log('[RBTCSwapIn->RSK] Error:', error)
          order.rsk.status = FAILED;
          throw (error);
        }
      }
    }

    //RBTC -> BTC FLOW
    if (order.flow === RBTC_TO_BTC) {
      /* 
        Esto triggerea cuando del lado de RSK se confirma la tx al contrato pero todavia no se hizo la tx del lado de BTC
      */
      if (chain === RSK && _.isEmpty(order.btc.txId)) {

        order.rsk.status = CONFIRMED;

        console.log(`Confirmed RSK tx ${order.rsk.txId}`);
        console.log(`Order Id: ${order._id}`);
        console.log(`Flow: ${RBTC_TO_BTC}`);


      }// if chain === RSK && _.isEmpty(order.btc.txId))

    }// if order.flow === RBTC_TO_BTC

  }// if (order[chain].status !== CONFIRMED && status === CONFIRMED)

}// function checkConfirmations();

async function processOrder(order, btcBlockHeight, rskBlockHeight) {
  try {
    await checkConfirmations(BTC, btcBlockHeight, BTC_BLOCK_HEIGHT_CONFIRMATION, order);
    await checkConfirmations(RSK, rskBlockHeight, RSK_BLOCK_HEIGHT_CONFIRMATION, order);

    if (
      order.flow === BTC_TO_RBTC &&
      order.btc.status === CONFIRMED &&
      order.rsk.status === UNCONFIRMED &&
      order.rsk.txId
    ) {

      if (order.rsk.status == SIGNATURE_PENDING || order.rsk.status == MULTISIG_PENDING) {
        console.log("[RBTCSwapIn->RSK] Awaiting user signature/multisig signature, checking next cycle ..");
        return;
      }

      const receipt = await getTransactionReceipt(order.rsk.txId);
      const blockNumber = _.get(receipt, 'blockNumber');
      const status = _.get(receipt, 'status');

      if (!_.isEmpty(receipt)) {
        order.rsk.block = blockNumber;
        order.rsk.status = (status) ?
          ((rskBlockHeight - blockNumber) >= RSK_BLOCK_HEIGHT_CONFIRMATION) ? CONFIRMED : UNCONFIRMED
          : FAILED;
      } else {
        order.rsk.status = UNCONFIRMED;
      }

    } else if (
      order.flow === BTC_TO_RBTC &&
      order.btc.status === CONFIRMED &&
      order.rsk.status === PENDING &&
      !order.rsk.txId
    ) {
      try {

        /**
         * Envio netValue: el usuario recibe del lado de RSK el valor de la orden menos el fee de operación.
         */
        const { transactionHash, txStatus, rawTransaction } = await swapIn(order.rsk.address, order.netValue, order._id);

        order.rsk.txId = transactionHash;
        order.rsk.status = txStatus;
        order.rsk.rawTransaction = rawTransaction;

      } catch (error) {
        console.log('[RBTCSwapIn->RSK] Error:', error);
        order.rsk.status = FAILED;
        throw (error);
      }
    }

    if (order.flow === RBTC_TO_BTC &&
      order.rsk.status === CONFIRMED &&
      order.btc.status === PENDING) {

      await btcWithdraw(order);

    } else if (
      order.flow === RBTC_TO_BTC &&
      order.rsk.status === CONFIRMED &&
      order.btc.status === UNCONFIRMED &&
      order.btc.txId
    ) {//caso 1 order value con txSigned hot_wallet y relay automático.
      const confirmations = await getBTCTxConfirmations(order.btc.txId);

      if (confirmations >= BTC_BLOCK_HEIGHT_CONFIRMATION) {
        order.btc.status = CONFIRMED;
      }
    } else if (//caso 2: order value unsignedRawtx desde hot_wallet sin relay automático.
      order.flow === RBTC_TO_BTC &&
      order.rsk.status === CONFIRMED &&
      order.btc.status === SIGNATURE_PENDING
    ) {

      /**
       * Si order.btc.txId es null quiere decir que el admin/operador no hizo la tx todavia y no tiene sentido chequear las confirmaciones.
       */
      if (order.btc.txId) {
        let confirmations = await getBTCTxConfirmations(order.btc.txId);
        if (confirmations >= BTC_BLOCK_HEIGHT_CONFIRMATION) {
          order.btc.status = CONFIRMED;
        }
      }

    } else if (//caso 3: order value desde MULTISIG
      order.flow === RBTC_TO_BTC &&
      order.rsk.status === CONFIRMED &&
      order.btc.status === MULTISIG_PENDING
    ) {
      /**
       * Si order.btc.txId es null quiere decir que el admin/operador no hizo la tx todavia y no tiene sentido chequear las confirmaciones.
       */
      if (order.btc.txId) {
        let confirmations = await getBTCTxConfirmations(order.btc.txId);
        if (confirmations >= BTC_BLOCK_HEIGHT_CONFIRMATION) {
          order.btc.status = CONFIRMED;
        }
      }
    }
  } catch (error) {
    console.log(error);
  } finally {
    try {
      console.log(`Saving: ${order._id}\nbtc: ${order.btc.status}\nrsk: ${order.rsk.status}`);
      await order.save();
    } catch (error) {
      console.log("Error saving order");
      console.log(error);
    }
  }
}

async function updateStatus() {
  console.log('Running updateStatus() ..');

  try {
    const orders = await ordersModel.find({
      '$or': [
        { 'btc.status': UNCONFIRMED },
        { 'btc.status': SIGNATURE_PENDING },
        { 'btc.status': MULTISIG_PENDING },
        { 'rsk.status': UNCONFIRMED },
        {
          'rsk.status': CONFIRMED,
          'btc.status': PENDING
        },
        {
          'rsk.status': PENDING,
          'btc.status': CONFIRMED
        }
      ],
      deleted: false
    });

    const block = await blocksModel.findOne().sort({ createdAt: -1 });
    const btcBlockNumber = _.get(block, BTC);
    const rskBlockNumber = _.get(block, RSK);

    for (let index = 0; index < orders.length; index++) {
      const order = orders[index];
      await processOrder(order, btcBlockNumber, rskBlockNumber);
    }
    console.log('Completed updateStatus()');
  } catch (error) {
    console.log(`[ERROR] Update status: ${error}`);
  }
}

module.exports = updateStatus;
