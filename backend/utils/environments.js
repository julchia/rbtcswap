require('dotenv').config();
const bitcoinjs = require('bitcoinjs-lib');

/**
 * 
 * @returns Returns bitcoinjs blockchain env
 */
function getBlockchainEnv() {

  try {
    const B_ENV = process.env.BLOCKCHAIN_ENV;

    let network = B_ENV == 'testnet' ? bitcoinjs.networks.testnet : bitcoinjs.networks.bitcoin;

    return network;

  } catch (error) {
    console.log(`[getBlockchainEnv] Error: ${error.message}`);
  }
}

module.exports = {
  getBlockchainEnv
};
