const BTC_EXPLORER_URL = process.env.VUE_APP_BTC_EXPLORER_URL

export const getBTCAddressUrl = (address) => {
  return `${BTC_EXPLORER_URL}/address/${address}/`;
} 

export const getBTCTxUrl = (tx) => {
  return `${BTC_EXPLORER_URL}/transaction/${tx}/`;
}
