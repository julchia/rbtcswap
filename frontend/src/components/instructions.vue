<template>
  <v-alert class="mt-8" elevation="2" type="info">
    <div class="font-weight-bold">Instructions</div>
    <ol>
      <li v-for="(instruction, index) in instructions" :key="index">
        {{ instruction }}
      </li>
    </ol>
  </v-alert>
</template>

<script>
import { BTC_TO_RBTC, RBTC_TO_BTC } from '../../../shared/flows';

const instructionsTemplates = {
  [BTC_TO_RBTC]: [
    'Add the value of BTC you would like to swap to RBTC.',
    'Add the address of the RSK wallet where you would like to receive the RBTCs.',
    'After submitting the order, transfer the EXACT required amount of BTC to the RBTC deposit address.',
    'You will receive the amount of RBTCs in your wallet after the block confirmations.',
  ],
  [RBTC_TO_BTC]: [
    'Add the value of RBTC you would like to swap to BTC.',
    'Add the address of the RSK address that will do the transaction.',
    'Add the address of the BTC wallet where you would like to receive the BTCs.',
    'After submitting the order, transfer the EXACT required amount of RBTC to the BTC deposit address from the sender RSK address.',
    'You will receive the amount of BTCs in your wallet after the block confirmations.',
  ],
};

export default {
  name: 'instructions',
  data: () => ({
    instructions: [],
  }),
  methods: {
    handleFlowChange: function () {
      this.instructions = instructionsTemplates[this.flow];
    },
  },
  mounted: function () {
    this.handleFlowChange();
  },
  props: ['flow'],
  watch: {
    flow: function () {
      this.handleFlowChange();
    },
  },
};
</script>
