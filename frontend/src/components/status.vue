<template>
  <v-tooltip top>
    <template v-slot:activator="{ on, attrs }">
      <span v-bind="attrs" v-on="on">
        <status-indicator :status="style" :pulse="pulse"></status-indicator>
      </span>
    </template>
    <span>
      {{ status.status | capitalize }}
    </span>
    <span v-if="showConfirmation">
      . Confirmations: {{ status.confirmations }} /
      {{ status.requiredConfirmations }}
    </span>
  </v-tooltip>
</template>

<script>
import { capitalize } from 'lodash';
import { StatusIndicator } from 'vue-status-indicator';
import STATUS from '../../../shared/status';

export default {
  name: 'status',
  components: { StatusIndicator },
  data: () => ({
    pulse: true,
    showConfirmation: false,
    style: 'intermediary',
  }),
  filters: {
    capitalize: (v) => capitalize(v),
  },
  methods: {
    initialize: function () {
      const { status } = this.status;

      switch (status) {
        case STATUS.PENDING:
          this.pulse = true;
          this.style = 'intermediary';
          break;

        case STATUS.UNCONFIRMED:
          this.pulse = true;
          this.showConfirmation = true;
          this.style = 'intermediary';
          break;

        case STATUS.CONFIRMED:
          this.pulse = false;
          this.showConfirmation = false;
          this.style = 'positive';
          break;

        case STATUS.FAILED:
          this.pulse = false;
          this.style = 'negative';
          break;

        default:
          break;
      }
    },
  },
  mounted: function () {
    this.initialize();
  },
  props: ['status'],
  watch: {
    'status.status': function () {
      this.initialize();
    },
  },
};
</script>
