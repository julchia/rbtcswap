const { BTC } = require('../../shared/chains');

require('dotenv').config();

// This method is a safe method if some .env *_BLOCK_HEIGHT_CONFIRMATION is 0
function getBlockHeight(chain) {
  const blockHeight = (chain === BTC) ? 
    Number(process.env.BTC_BLOCK_HEIGHT_CONFIRMATION) : 
    Number(process.env.RSK_BLOCK_HEIGHT_CONFIRMATION);
  const delta = blockHeight - 1;

  return (delta < 0) ? 0 : delta; 
}

module.exports = {
  getBlockHeight
};
