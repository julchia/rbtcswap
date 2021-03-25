require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {

  networks: {

    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
    },

    coverage: {
      host: "127.0.0.1",
      network_id: "*",
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01,
    },

    ganache: {
      host: "127.0.0.1",
      port: 8545,
      network_id: '*'
    },

    kovan: {
      provider: () => {
        return new HDWalletProvider(
          process.env.DEPLOYER_MNENOMIC, "https://kovan.infura.io/v3/" + process.env.INFURA_API_KEY
        )
      },
      network_id: 42,
      gasPrice: 1000000000
    }
  },

  plugins: ["solidity-coverage"],

  mocha: {
    timeout: '10000'
  },

  compilers: {
    solc: {
      version: "0.7.6",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
}
