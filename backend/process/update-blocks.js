const { getBlockNumber } = require('../utils/block');
const { getBlockNumber: getRSKBlockNumber } = require('../rsk/index');
const blocksModel = require('../models/blocks');

/**
 * Dejo historial de bloques solo desde 6hs atrás
 */
async function clearOldBlocks() {

  try {

    const X = 6;
    const _XHourAgo = new Date(Date.now() - X * 60 * 60 * 1000);

    let filter = {
      createdAt: {
        $lt: _XHourAgo
      }
    }

    let { deletedCount } = await blocksModel.deleteMany(filter);

    if(deletedCount > 0)
      console.log(`Deleting ${deletedCount} old blocks from db.`);
  } catch (error) {
    console.log(`[cleanBlocks] Error: ${error}`);
  }

}


async function updateBlocks() {
  try {
    console.log('Running updateBlocks() ...');

    const btcBlockNumber = await getBlockNumber();
    const rskBlockNumber = await getRSKBlockNumber();

    const block = new blocksModel({
      btc: btcBlockNumber,
      rsk: rskBlockNumber
    });

    await block.save();
    await clearOldBlocks();

    console.log('Finish updateBlocks() ...');
  } catch (error) {
    console.log('[ERROR] updateBlocks', error.message);
  }
}

module.exports = updateBlocks;
