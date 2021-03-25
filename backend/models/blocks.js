const mongoose = require('mongoose');

const schemaConfig = {
  toJSON: {
    virtuals: true,
    getters: true
  },
  collection: 'blocks',
  timestamps: true
};

const blocksSchema = new mongoose.Schema({
  btc: {
    default: 0,
    type: String
  },
  rsk: {
    default: 0,
    type: String
  }
}, schemaConfig);

const blocksModel = mongoose.model('blocksModel', blocksSchema);

module.exports = blocksModel;
