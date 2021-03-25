const { createWatchdogTimer } = require('watchdog-timer');
const { processSwapOut } = require('../rsk/index');
const checkBalances = require('./check-balances');
const cleanUpOrders = require('./clean-orders');
const updateBlocks = require('./update-blocks');
const updateStatus = require('./update-status');

require('dotenv').config();

(async function () {
  require('../utils/connection');

  const ONE_MINUTE_IN_MILISECONDS = 60000;
  const WATCHDOG_TIMEOUT_IN_MILISECONDS = ONE_MINUTE_IN_MILISECONDS + 15000;

  const X = 20;
  const _XMIN_IN_MILISECONDS = ONE_MINUTE_IN_MILISECONDS * X;

  const watchdogTimer = createWatchdogTimer({
    onTimeout: () => {
      console.error('[-] Watchdog timer timeout; forcing program termination.');

      process.nextTick(() => {
        process.exit(1);
      });
    },
    timeout: WATCHDOG_TIMEOUT_IN_MILISECONDS,
  });

  await cleanUpOrders();
  await updateBlocks();
  await processSwapOut();
  await updateStatus();

  setInterval(async () => {

    /**
     * Este es el reset del timer, si no pasa por acá durante WATCHDOG_TIMEOUT_IN_MILISECONDS mata el proceso.
     * Comentar para deshabilitar watchdog.
     */
    watchdogTimer.reset();
    console.log("WatchDog timer resets, no process killing ..\n");

    await cleanUpOrders();
    await updateBlocks();
    await processSwapOut();
    await updateStatus();

  }, ONE_MINUTE_IN_MILISECONDS);

  /**
   * Separo el interval de checkeo de balances para no reventar ElectrumX cada 1 minuto.
   */
  setInterval(async () => {
    await checkBalances();
  }, _XMIN_IN_MILISECONDS);

}());
