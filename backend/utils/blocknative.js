const _ = require('lodash');
const axios = require('axios');

require('dotenv').config();

function registerAddress(address) {
  return new Promise(async (resolve, reject) => {
    try {
      const options = {
        'Content-Type': 'application/json;charset=UTF-8'
      };
      const params = {
        address,
        apiKey: process.env.BLOCKNATIVE_APIKEY,
        blockchain: 'bitcoin',
        networks: [process.env.BTC_NETWORK]
      };

      const response = await axios.post(process.env.BLOCKNATIVE_ADDRESS, params, options);
      const msg = _.get(response, 'data.msg');

      resolve(msg);
    } catch (error) {
      console.error(error);

      reject('Error creating hook');
    }
  });
}

async function unwatchAddress(address) {
  try {
    const options = {
      data: {
        address,
        apiKey: process.env.BLOCKNATIVE_APIKEY,
        blockchain: 'bitcoin',
        networks: [process.env.BTC_NETWORK]
      },
      headers: {
        'Content-Type': 'application/json;charset=UTF-8'
      }
    };

    const response = await axios.delete(process.env.BLOCKNATIVE_ADDRESS, options);
    const msg = _.get(response, 'data.msg');
    
    return msg;
  } catch (error) {
    console.log(`[unwatchAddress] Error: ${error.message}`);
    return 'Error removing hook';
  }
}

module.exports = {
  registerAddress,
  unwatchAddress
};
