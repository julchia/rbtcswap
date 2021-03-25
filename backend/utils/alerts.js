const _ = require('lodash');
const axios = require('axios');

require('dotenv').config();

const TG_LOGS_URI = process.env.TG_LOGS_URI;
const TG_NOTIFICATIONS_URI = process.env.TG_NOTIFICATIONS_URI;

async function sendAlert(_msg, _bot) {
  try {
    if (!_msg) {
      return 'Missing parameter';
    }

    let alertMsg = _msg;
    let TG_QUERY = `${_bot}&name=${alertMsg}`;

    let sendQuery = await axios.get(TG_QUERY);

    console.log(sendQuery.data);

    return;
  } catch (error) {
    console.log('Failed to send Telegram Alert');
    console.log(error);
    return;
  }
}

async function sendLogAlert(msg) {
  await sendAlert(msg, TG_LOGS_URI);
}

async function sendNotificationAlert(msg) {
  await sendAlert(msg, TG_NOTIFICATIONS_URI);
}

module.exports = {
  sendLogAlert,
  sendNotificationAlert
};

