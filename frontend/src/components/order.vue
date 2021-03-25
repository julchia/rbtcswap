<template>
  <div class="order">
    <v-container class="lighten-5">
      <v-row>
        <v-col lg="6" md="6" class="pa-8">
          <v-row>
            <v-col class="py-0">
              <p
                class="order__title subtitle-1 text--primary"
                v-if="rbtcSenderAddress"
              >
                RBTC sender address
              </p>
            </v-col>
          </v-row>

          <v-row class="d-flex align-center mb-2" v-if="rbtcSenderAddress">
            <v-col class="col-10">
              <span class="font-weight-black">{{ rbtcSenderAddress }}</span>
            </v-col>
            <v-col class="col-2 d-flex align-center justify-center">
              <v-btn
                x-small
                class="mr-2"
                @click="copyToClipboard(rbtcSenderAddress)"
              >
                <v-icon size="18">mdi-content-copy</v-icon>
              </v-btn>
              <a
                :href="getRSKAddressUrl(rbtcSenderAddress)"
                target="_blank"
                style="text-decoration: none"
              >
                <v-btn x-small>
                  <v-icon size="18">mdi-arrow-top-right</v-icon>
                </v-btn>
              </a>
            </v-col>
          </v-row>

          <v-row v-if="rbtcSenderAddress">
            <v-col class="py-0">
              <qr-code :text="rbtcSenderAddress"></qr-code>
            </v-col>
          </v-row>

          <v-row>
            <v-col class="pb-0">
              <p class="order__title subtitle-1 text--primary">
                {{ fromCoin() }} deposit address

                <span class="order__title__status">
                  <status :status="depositStatus"></status>
                </span>
              </p>
            </v-col>
          </v-row>

          <v-row class="d-flex align-center mb-2">
            <v-col class="col-10">
              <span class="font-weight-black">{{ depositAddress }}</span>
            </v-col>
            <v-col class="col-2 d-flex align-center justify-center">
              <v-btn
                x-small
                class="mr-2"
                @click="copyToClipboard(depositAddress)"
              >
                <v-icon size="18">mdi-content-copy</v-icon>
              </v-btn>
              <a
                :href="fromAddressUrl(depositAddress)"
                target="_blank"
                style="text-decoration: none"
              >
                <v-btn x-small>
                  <v-icon size="18">mdi-arrow-top-right</v-icon>
                </v-btn>
              </a>
            </v-col>
          </v-row>

          <v-row>
            <v-col class="py-0">
              <qr-code :text="depositAddress"></qr-code>
            </v-col>
          </v-row>

          <v-row>
            <v-col class="py-0">
              <p class="subtitle-1 text--primary" v-if="depositTxId">
                Deposit transaction
              </p>
            </v-col>
          </v-row>

          <v-row class="d-flex align-center mb-2" v-if="depositTxId">
            <v-col class="col-10">
              <span class="font-weight-black">{{ depositTxId }}</span>
            </v-col>
            <v-col class="col-2 d-flex align-center justify-center">
              <v-btn x-small class="mr-2" @click="copyToClipboard(depositTxId)">
                <v-icon size="18">mdi-content-copy</v-icon>
              </v-btn>
              <a
                :href="fromTxUrl(depositTxId)"
                target="_blank"
                style="text-decoration: none"
              >
                <v-btn x-small>
                  <v-icon size="18">mdi-arrow-top-right</v-icon>
                </v-btn>
              </a>
            </v-col>
          </v-row>

          <v-row>
            <v-col class="pb-0">
              <p class="subtitle-1 text--primary">Value</p>
            </v-col>
          </v-row>

          <v-row>
            <v-col class="py-0">
              <p class="font-weight-black headline">
                {{ value }} {{ fromCoin() }}
              </p>
            </v-col>
          </v-row>
        </v-col>

        <v-col lg="6" md="6" class="pa-8">
          <v-row>
            <v-col class="pb-0">
              <p class="order__title subtitle-1 text--primary">
                {{ toCoin() }} recipient address

                <span class="order__title__status">
                  <status :status="transferStatus"></status>
                </span>
              </p>
            </v-col>
          </v-row>

          <v-row class="d-flex align-center mb-2">
            <v-col class="col-10">
              <span class="font-weight-black">{{ transferAddress }}</span>
            </v-col>
            <v-col class="col-2 d-flex align-center justify-center">
              <v-btn
                x-small
                class="mr-2"
                @click="copyToClipboard(transferAddress)"
              >
                <v-icon size="18">mdi-content-copy</v-icon>
              </v-btn>
              <a
                :href="toAddressUrl(transferAddress)"
                target="_blank"
                style="text-decoration: none"
              >
                <v-btn x-small>
                  <v-icon size="18">mdi-arrow-top-right</v-icon>
                </v-btn>
              </a>
            </v-col>
          </v-row>

          <v-row>
            <v-col class="py-0">
              <qr-code :text="transferAddress"></qr-code>
            </v-col>
          </v-row>

          <p class="subtitle-1 text--primary" v-if="transferTxId">
            Recipient transaction
          </p>

          <v-row
            class="d-flex align-center mb-2 light-grey"
            v-if="transferTxId"
          >
            <v-col class="col-10">
              <span class="font-weight-black">{{ transferTxId }}</span>
            </v-col>
            <v-col class="col-2 d-flex align-center justify-center">
              <v-btn
                @click="copyToClipboard(transferTxId)"
                class="mr-2"
                x-small
              >
                <v-icon size="18">mdi-content-copy</v-icon>
              </v-btn>
              <a
                :href="toTxUrl(transferTxId)"
                style="text-decoration: none"
                target="_blank"
              >
                <v-btn x-small>
                  <v-icon size="18">mdi-arrow-top-right</v-icon>
                </v-btn>
              </a>
            </v-col>
          </v-row>

          <v-row>
            <v-col class="pb-0">
              <p class="subtitle-1 text--primary">Value</p>
            </v-col>
          </v-row>

          <v-row>
            <v-col class="py-0">
              <p class="font-weight-black headline">
                {{ netValue }} {{ toCoin() }}
              </p>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import _ from 'lodash';
import { BTC_TO_RBTC, RBTC_TO_BTC } from '../../../shared/flows';
import { getBTCAddressUrl, getBTCTxUrl } from '@/utils/btc-urls';
import { getRSKAddressUrl, getRSKTxUrl } from '@/utils/rsk-urls';
import QrCode from '@/components/qr-code';
import Status from '@/components/status';
import SYMBOLS from '../../../shared/symbols';

export default {
  name: 'order',
  components: {
    'qr-code': QrCode,
    Status,
  },
  data: () => ({
    confirmations: '',
    coin: '',
    depositAddress: '',
    depositStatus: {},
    depositTxId: '',
    flow: '',
    netValue: '',
    rbtcSenderAddress: false,
    requiredConfirmations: '',
    transferAddress: '',
    transferStatus: {},
    transferTxId: '',
    txId: '',
    value: '',
  }),
  mounted: function () {
    this.initialize(this.order);
  },
  methods: {
    fromAddressUrl: function (url) {
      const method =
        this.flow === BTC_TO_RBTC ? getBTCAddressUrl : getRSKAddressUrl;

      return method(url);
    },
    fromTxUrl: function (url) {
      const method = this.flow === BTC_TO_RBTC ? getBTCTxUrl : getRSKTxUrl;

      return method(url);
    },
    fromCoin: function () {
      return this.flow === BTC_TO_RBTC ? SYMBOLS.BTC : SYMBOLS.RBTC;
    },
    getRSKAddressUrl,
    initialize: function (order) {
      if (!_.isEmpty(order)) {
        const { flow, netValue, value } = order;
        const fromChain = flow === BTC_TO_RBTC ? 'btc' : 'rsk';
        const toChain = flow === BTC_TO_RBTC ? 'rsk' : 'btc';

        this.coin = flow === BTC_TO_RBTC ? SYMBOLS.BTC : SYMBOLS.RBTC;
        this.depositAddress = order[fromChain].address;
        this.depositStatus = {
          confirmations: order[fromChain].confirmations,
          requiredConfirmations: order[fromChain].requiredConfirmations,
          status: order[fromChain].status,
        };
        this.depositTxId = order[fromChain].txId;
        this.flow = flow;
        this.netValue = netValue;
        this.rbtcSenderAddress =
          flow === RBTC_TO_BTC ? order.rsk.senderAddress : false;
        this.transferAddress = order[toChain].address;
        this.transferStatus = {
          confirmations: order[toChain].confirmations,
          requiredConfirmations: order[toChain].requiredConfirmations,
          status: order[toChain].status,
        };
        this.transferTxId = order[toChain].txId;
        this.value = value;
      }
    },
    toCoin: function () {
      return this.flow === BTC_TO_RBTC ? SYMBOLS.RBTC : SYMBOLS.BTC;
    },
    toTxUrl: function (url) {
      const method = this.flow === BTC_TO_RBTC ? getRSKTxUrl : getBTCTxUrl;

      return method(url);
    },
    toAddressUrl: function (url) {
      const method =
        this.flow === BTC_TO_RBTC ? getRSKAddressUrl : getBTCAddressUrl;

      return method(url);
    },
    async copyToClipboard(text) {
      await navigator.clipboard.writeText(text);
    },
  },
  props: ['order'],
  watch: {
    order: function (newOrder) {
      this.initialize(newOrder);
    },
  },
};
</script>
