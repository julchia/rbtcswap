const address = require('./address');

function webHooksApi(app) {
  app.use('/api/webhook/address', address);
}

module.exports = webHooksApi;
