const _ = require('lodash');
const addressesModel = require('../../models/addresses');
const express = require('express');
const FLOWS = require('../../../shared/flows');
const ordersModel = require('../../models/orders');
const STATUS = require('../../../shared/status');
const { rateLimiter } = require('../../utils/rate-limiter');
const { sendLogAlert } = require('../../utils/alerts');

const router = express.Router();

require('dotenv').config();

router.post('/', rateLimiter, async (req, res) => {
  const {
    blockHeight,
    fee,
    rawTransaction,
    status,
    txid,
    watchedAddress,
    netBalanceChanges,
    apiKey
  } = req.body;

  /**
   * Reviso que esté apiKey en el request y lo comparo con la apiKey de blocknative para auth.
   * En caso de fallar devuelvo http 401: unauthorized.
   */
  if (!apiKey || apiKey != process.env.BLOCKNATIVE_APIKEY)
    return res.sendStatus(401);

  console.log("\n####### Blocknative webhook received");
  console.log("WatchedAdress:", watchedAddress);
  console.log("Status:", status);
  console.log("TxId:", txid);
  console.log("Block:", blockHeight);
  console.log("####### Blocknative webhook end\n");

  try {
    const order = await ordersModel.findOne({
      'btc.address': watchedAddress,
      flow: FLOWS.BTC_TO_RBTC,
      deleted: false
    });

    /**
     * Si no encuentra la orden, igual le devuelvo 200 status al webhook para que no siga llegando.
     */
    if (_.isEmpty(order))
      return res.sendStatus(200);

    /**
     * Busco la dirección watcheAda y pongo en delta el value transferido
     */
    const { delta } = netBalanceChanges.find(({ address }) => {
      return address === watchedAddress;
    });

    /**
     * En delta tengo el valor que se transfirió a watchedAddress
     * Por requerimiento:
     * Si delta < value, el usuario se jode
     * Si delta == value, ok triggereamos conversion
     * Si delta > value, ok triggereamos conversion y después MANUALMENTE se le devuelve el excedente.
     */
    if (delta < Number(order.value)) {
      let msg = `Value sent to watchedAddress: ${watchedAddress} detected, but value is less than expected.\nValue: ${order.value}\nDelta: ${delta}\nOrder Id: ${order._id}`;
      console.log(msg);
      sendLogAlert(msg);
      return res.sendStatus(200);
    }

    // Se incluyo en el bloque de BTC pero no se mino
    if (status === STATUS.PENDING) {
      order.btc.fee = fee;
      order.btc.rawTransaction = rawTransaction;
      order.btc.status = STATUS.UNCONFIRMED;
      order.btc.txId = txid;
    }

    // Confirmado en blocknative
    if (status === STATUS.CONFIRMED) {
      order.btc.block = blockHeight;
    }

    let addressDoc = await addressesModel.findOne({
      orderId: order._id
    });

    addressDoc.used = true;
    await addressDoc.save();

    await order.save();

    return res.sendStatus(200);
  } catch (error) {
    console.log(error.message);
    return res.sendStatus(500);
  }
});

module.exports = router;
