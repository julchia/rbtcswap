const _ = require('lodash');
const { BTC_TO_RBTC, RBTC_TO_BTC } = require('../../../shared/flows');
const { BTC, RSK } = require('../../../shared/chains');
const { getAddrNextIndex, deriveAddrByIndex } = require('../../utils/address');
const { getBlockchainEnv } = require('../../utils/environments');
const { getBlockHeight } = require('../../utils/block-height');
const { isAddressValid } = require('../../utils/address');
const { CONFIRMED, PENDING } = require('../../../shared/status');
const { rateLimiter } = require('../../utils/rate-limiter');
const { registerAddress } = require('../../utils/blocknative');
const addressesModel = require('../../models/addresses');
const BigNumber = require('bignumber.js');
const express = require('express');
const ordersModel = require('../../models/orders');
const mongoSanitize = require('express-mongo-sanitize');

const BTC_BLOCK_HEIGHT_CONFIRMATION = getBlockHeight(BTC);
const FAST_SWAP_ADDRESS = process.env.FAST_SWAP_ADDRESS;
const RSK_BLOCK_HEIGHT_CONFIRMATION = getBlockHeight(RSK);

const MAX_VALUE = process.env.APP_TRANSFER_MAX;
const MIN_VALUE = process.env.APP_TRANSFER_MIN;

const router = express.Router();

require('dotenv').config();

const existOrderWithSenderAddress = async (senderAddress) => {
  const order = await ordersModel.find({
    'btc.status': { $ne: CONFIRMED },
    flow: RBTC_TO_BTC,
    deleted: false,
    'rsk.senderAddress': senderAddress,
    'rsk.status': { $ne: CONFIRMED }
  });

  return !_.isEmpty(order);
}

const getNetValue = (_operationFee, _value) => {

  let valueBn = new BigNumber(Number(_value));
  let valueFeeBn = new BigNumber(Number(_operationFee));

  let dcPlaces = valueBn.dp() + valueFeeBn.dp();

  return (Number(_value) - (Number(_value) * _operationFee)).toFixed(dcPlaces);

};

router.post('/', rateLimiter, async (req, res) => {

  /**
   * Sanitizo los objetos del body para evitar NoSQL injection.
   */
  let _body = mongoSanitize.sanitize(req.body);

  const { btc, flow, rsk, value } = _body;

  if (_.isEmpty(flow)) {
    return res.status(400).json({
      error: 'flow is a required parameter.'
    });
  }

  if (![BTC_TO_RBTC, RBTC_TO_BTC].includes(flow)) {
    return res.status(400).json({
      error: 'Choose a valid conversion flow.'
    });
  }

  if (_.isNaN(Number(value)) || value <= 0) {
    return res.status(400).json({
      error: 'value is a required parameter.'
    });
  }

  if (_.isEqual(flow, RBTC_TO_BTC)) {

    try {

      const existOrder = await existOrderWithSenderAddress(rsk.senderAddress);

      if (existOrder) {
        return res.status(400).json({
          error: 'Order with sender address already exist.'
        });
      }

      const network = getBlockchainEnv();

      if (!isAddressValid(btc.address, network)) {
        return res.status(400).json({
          error: {
            form: {
              address: 'Recipient address must be a valid BTC address.'
            }
          }
        });
      }

    } catch (error) {
      console.log(error);
      return res.status(500).json({ error });
    }
  }

  /**
   * Chequeo backend side que los valores esten dentro de los parámetros para evitar ataques con BURP client side.
   */
  if (Number(value) < MIN_VALUE || Number(value) > MAX_VALUE) {
    return res.status(400).json({
      error: 'Value error; check MIN/MAX caps.'
    });
  }

  /**
   * Cálculo de value bruto de orden menos el fee de operación.
   */
  const OPERATION_FEE = process.env.OPERATION_FEE_PERCENT;

  let netValue = getNetValue(OPERATION_FEE, value);

  try {
    const order = new ordersModel({
      flow,
      value,
      netValue: netValue,
      operationFee: OPERATION_FEE
    });

    if (flow === BTC_TO_RBTC) {
      let idx = await getAddrNextIndex();
      let depositAddr = deriveAddrByIndex(idx);
      let newAddrDoc = new addressesModel();

      newAddrDoc.orderId = order._id;
      newAddrDoc.address = depositAddr;
      newAddrDoc.derivationIndex = idx;

      await newAddrDoc.save();
      await registerAddress(depositAddr);

      order.btc = {
        address: depositAddr,
        confirmations: 0,
        requiredConfirmations: BTC_BLOCK_HEIGHT_CONFIRMATION,
        status: PENDING
      };
      order.rsk = {
        address: rsk.address,
        status: PENDING
      };
    }

    if (flow === RBTC_TO_BTC) {

      order.btc = {
        address: btc.address,
        status: PENDING
      };
      order.rsk = {
        address: FAST_SWAP_ADDRESS,
        confirmations: 0,
        requiredConfirmations: RSK_BLOCK_HEIGHT_CONFIRMATION,
        senderAddress: rsk.senderAddress,
        status: PENDING
      }
    }

    await order.save();

    return res.json({
      data: { order }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error });
  }
});

module.exports = router;
