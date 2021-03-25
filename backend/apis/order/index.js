const create = require('./create');
const get = require('./get');

function orderApi(app) {
  app.use('/api/order', create);
  app.use('/api/order', get);
}

module.exports = orderApi;
