const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '..', '.env')
})
require('@openzeppelin/test-helpers/configure')({
  provider: web3.currentProvider,
  environment: 'truffle'
});

const FastSwap = artifacts.require('FastSwap');

module.exports = async function (deployer, network, accounts) {
  const OWNER = network == 'kovan'
    ? process.env.DEPLOYER_ADDRESS
    : accounts[0];
  const OPERATOR = network == 'kovan'
  ? process.env.OPERATOR_ADDRESS
  : accounts[1];

  // maxAmount: 100000
  // minAmount: 10
  await deployer.deploy(
    FastSwap,
    OPERATOR,
    '100000000000000000000000',
    '10000000000000000000',
    { from: OWNER }
  );
};
