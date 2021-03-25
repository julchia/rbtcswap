const STATUS = Object.freeze({
  PENDING: 'pending',
  SIGNATURE_PENDING: 'signature_pending',
  MULTISIG_PENDING: 'multisig_pending',
  UNCONFIRMED: 'unconfirmed',
  CONFIRMED: 'confirmed',
  FAILED: 'failed'
});

module.exports = STATUS;
