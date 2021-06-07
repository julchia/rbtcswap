const _ = require('lodash');
const { BTC, RSK } = require('../../../shared/chains');
const { rateLimiter } = require('../../utils/rate-limiter');
const blocksModel = require('../../models/blocks');
const express = require('express');
const ordersModel = require('../../models/orders');
const mongoSanitize = require('express-mongo-sanitize');

require('dotenv').config();

const BTC_BLOCK_HEIGHT_CONFIRMATION = Number(process.env.BTC_BLOCK_HEIGHT_CONFIRMATION);
const RSK_BLOCK_HEIGHT_CONFIRMATION = Number(process.env.RSK_BLOCK_HEIGHT_CONFIRMATION);
const router = express.Router();

const getConfirmations = (chain, blockNumber) => {
  const block = _.get(chain, 'block');

  if (!block) return 0;

  const delta = blockNumber - block;

  return (delta <= 0) ? 0 : delta;
}

router.get('/:id', rateLimiter, async (req, res) => {
  
  const { id } = mongoSanitize.sanitize(req.params);

  try {
    /**
     * Busco la orden por id pero que no esté marcada como deleted.
     */

    if (_.isEmpty(id)) {
      return res.status(400).json({
        error: 'Missing Parameters'
      });
    }

    const order = await ordersModel.findOne({
      _id: id,
      deleted: false
    });

    if (_.isEmpty(order)) {
      return res
        .status(404)
        .json({
          error: 'Order expired or does not exist.'
        });
    }

    const block = await blocksModel.findOne().sort({ createdAt: -1 });
    const btcBlockNumber = _.get(block, BTC);
    const rskBlockNumber = _.get(block, RSK);

    return res.json({
      data: {
        order: {
          ...order.toJSON(),
          btc: {
            ...order.btc,
            confirmations: getConfirmations(order.btc, btcBlockNumber),
            requiredConfirmations: BTC_BLOCK_HEIGHT_CONFIRMATION
          },
          rsk: {
            ...order.rsk,
            confirmations: getConfirmations(order.rsk, rskBlockNumber),
            requiredConfirmations: RSK_BLOCK_HEIGHT_CONFIRMATION
          }
        }
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: 'Error fetching order'
    });
  }
});

module.exports = router;
