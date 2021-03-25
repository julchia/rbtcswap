const { Schema, model } = require('mongoose');
const FLOWS = require('../../shared/flows');
const STATUS = require('../../shared/status');

const schemaConfig = {
  toJSON: {
    virtuals: true,
    getters: true
  },
  collection: 'orders',
  timestamps: true
};

const ordersSchema = new Schema({
  btc: {
    address: String,
    block: String,
    fee: String,
    rawTransaction: Object,
    unsignedRawHexTx: Object,
    status: {
      default: STATUS.PENDING,
      enum: Object.values(STATUS),
      type: String
    },
    txId: String
  },
  deleted: {
    type: Boolean,
    default: false
  },
  flow: {
    default: FLOWS.BTC_TO_RBTC,
    enum: Object.values(FLOWS),
    type: String
  },
  rsk: {
    address: String,
    block: String,
    senderAddress: String,
    status: {
      default: STATUS.PENDING,
      enum: Object.values(STATUS),
      type: String
    },
    rawTransaction: Object,
    txId: String
  },
  value: String,
  netValue: String,
  operationFee: Number,
}, schemaConfig);

const ordersModel = model('ordersModel', ordersSchema);

module.exports = ordersModel;
