const _ = require('lodash');
const axios = require('axios');
const { sendLogAlert } = require('./alerts');
const { connect } = require('./electrumx');
require('dotenv').config();

const BTC_INFO_URL = process.env.BTC_INFO_URL;

/**
 * Get latest block by querying some API service. 
 */
async function getBlockNumberApi() {
  try {

    const response = await axios.get(`${BTC_INFO_URL}/blocks?limit=1`);
    const blockNumber = _.get(response, 'data.data[0].id', {});

    return blockNumber;
  } catch (error) {
    console.log(error);

    return -1;
  }
}

/**
 * Get the latest block by subscribing to electrum blockheaders and then closing the client
 * If return -1 then error happened.
 */
async function getBlockNumberElectrumX() {
  try {
    const client = await connect();
    const { height } = await client.blockchain_headers_subscribe();
    return height;
  } catch (error) {
    console.log("[getBlockNumberElectrumX] Error:", error.message);
    return -1;
  }
}

/**
 * Intento fetchear el latestBlock de Electrum primero.
 * Si fallo intento de la api de Blockchair
 * Sino devuelvo -1 y alerto.
 */
async function getBlockNumber() {

  let latestBlock;

  latestBlock = await getBlockNumberElectrumX();

  if (latestBlock != -1)
    return latestBlock;

  console.log("[Warning] Failed to fetch Electrum block height, falling back to API query ..");
  latestBlock = await getBlockNumberApi();

  if (latestBlock != -1)
    return latestBlock;

  await sendLogAlert("[ALERT] Failed to fetch Electrum and API block height, returning -1");
  return -1;

};

module.exports = {
  getBlockNumber: getBlockNumber
};
