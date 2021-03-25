
const ElectrumClient = require('@codewarriorr/electrum-client-js');
require('dotenv').config();

async function connect() {

  let ss = process.env.BTC_ELECTRUM_SERVERS.split(",");
  let server = ss[Math.floor(Math.random() * Math.floor(ss.length))].split("|");

  try {
    let BTC_ELECTRUM_URI = server[0];
    let BTC_ELECTRUM_PORT = server[1];
    let BTC_ELECTRUM_PROTOCOL = server[2];

    let client = new ElectrumClient(
      BTC_ELECTRUM_URI,
      BTC_ELECTRUM_PORT,
      BTC_ELECTRUM_PROTOCOL
    );
    console.log("Trying connection to:", server);
    await client.connect();

    return client;
  } catch (error) {
    console.log(`Failed to connect to ${server}, retrying ..`);
    await connect();
  }
}

module.exports = {
  connect
};