const { getBTCAddressBalance, getRSKAddressBalance } = require('../utils/address');
const { sendLogAlert } = require('../utils/alerts');

require('dotenv').config();

const BALANCE_ALERT_VALUE = process.env.AUTOMATIC_TX_THRESHOLD;

/**
 * Get balances of RSKSWAP HOT addresses.
 */
async function fastSwapBalances() {
  try {

    let btcHotAddrBalance = await getBTCAddressBalance(process.env.BTC_HOT_WALLET_ADDR);
    let rskContractBalance = await getRSKAddressBalance(process.env.FAST_SWAP_ADDRESS.toLowerCase());

    return {
      btc: {
        hot: {
          address: process.env.BTC_HOT_WALLET_ADDR,
          balance: btcHotAddrBalance
        }
      },
      rsk: {
        address: process.env.FAST_SWAP_ADDRESS,
        balance: rskContractBalance
      }
    };

  } catch (error) {
    console.log(error);
    return {};
  }

};

/**
 * 
 * @param {Address to alert of} _addr String
 * @param {balance} _value number
 */
async function lowBalanceAlert(_addr, _value) {
  try {

    if (_value == -1)
      await sendLogAlert("[ALERT] Error fetching balance for address:", _addr);
    else {
      let msg = `[WARNING] Address: ${_addr} with balance: ${_value} is running low.`
      await sendLogAlert(msg);
    }
  } catch (error) {
    console.log(error);
    return error;
  }
}

/**
 * Check all balances and send Telegram alerts accordingly.
 */
async function checkBalances() {
  try {
    console.log("Checking fastswap balances ..");

    let balances = await fastSwapBalances();

    const MIN_RSK_VALUE = BALANCE_ALERT_VALUE * 10;
    const MIN_BTC_VALUE = BALANCE_ALERT_VALUE * 10;

    if (Number(balances.rsk.balance) <= MIN_RSK_VALUE)
      await lowBalanceAlert(balances.rsk.address, Number(balances.rsk.balance));

    if (balances.btc.hot.balance <= MIN_BTC_VALUE)
      await lowBalanceAlert(balances.btc.hot.address, balances.btc.hot.balance);

    console.log("Fastswap balance check done, all good.");

  } catch (error) {
    console.log(error);
    return -1;
  }
}

module.exports = checkBalances;
