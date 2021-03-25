const mongoose = require('mongoose');

const schemaConfig = {
  toJSON: {
    virtuals: true,
    getters: true
  },
  collection: 'addresses',
  timestamps: true
};

const addressesSchema = new mongoose.Schema({
  used: {
    type: Boolean,
    default: false
  },
  address: String,
  derivationIndex: Number,
  orderId: {
    type: mongoose.Types.ObjectId,
    ref: 'orders'
  }
}, schemaConfig);

const addressesModel = mongoose.model('addressesModel', addressesSchema);

module.exports = addressesModel;
