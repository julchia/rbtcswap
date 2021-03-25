const { BTC_TO_RBTC } = require('../../shared/flows');
const { PENDING, CONFIRMED } = require('../../shared/status');
const { unwatchAddress } = require('../utils/blocknative');
const ordersModel = require('../models/orders');

require('dotenv').config();

async function cleanOrder(order) {
  try {
    /**
     * Si el flow es de ida BTC a RBTC, limpio la address del hook de blocknative.
     */
    if (order.flow === BTC_TO_RBTC) {
      let addr = order.btc.address;
      console.log(`Unwatching address: ${addr}`)
      await unwatchAddress(addr);
    }

    order.deleted = true;
    console.log(`Marking as deleted order _id: ${order._id}`);
    await order.save();
  } catch (error) {
    console.log("[WARNING] Error on cleanOrder() ");
    console.log(error);
  }
}

/**
 * Busco ordenes que no estan borradas
 * Que estan en pending
 * el createdAt - now >= 2hs
 * unwatch de la adddr si el flow es btc a rbtc
 * pongo la orden en deleted: true
 */
async function cleanUpOrders() {
  console.log("Running cleanupOrders()");
  try {

    const X = 6;
    const _XHourAgo = new Date(Date.now() - X * 60 * 60 * 1000);

    const D = 10;
    const _XDaysAgo = new Date(Date.now() - D * 24 * 60 * 60 * 1000);

    /**
     * Limpio ordenes pending de más de 2hs o confirmadas (en ambos lados de más de 10 dias)
     */
    let filter = {
      $or: [
        {
          'btc.status': PENDING,
          'rsk.status': PENDING,
          createdAt: {
            $lt: _XHourAgo
          },
          deleted: false
        },
        {
          'btc.status': CONFIRMED,
          'rsk.status': CONFIRMED,
          createdAt: {
            $lt: _XDaysAgo
          },
          deleted: false
        }
      ]
    }

    let orders = await ordersModel.find(filter);

    for (let index = 0; index < orders.length; index++) {
      await cleanOrder(orders[index]);
    }
    console.log("Completed cleanupOrders()");
  } catch (error) {
    console.log("[ERROR] trying to execute cleanUpOrders()");
    console.log(error);
  }
}

module.exports = cleanUpOrders;
