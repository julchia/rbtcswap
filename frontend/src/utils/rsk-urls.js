const RSK_EXPLORER_URL = process.env.VUE_APP_RSK_EXPLORER_URL

export const getRSKAddressUrl = (address) => {
  return `${RSK_EXPLORER_URL}/address/${address.toLowerCase()}/`;
} 

export const getRSKTxUrl = (tx) => {
  return `${RSK_EXPLORER_URL}/tx/${tx}/`;
}
