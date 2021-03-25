<template>
  <v-snackbar v-model="open" :multi-line="true">
    {{ error }}

    <template v-slot:action="{ attrs }">
      <v-btn color="red" text v-bind="attrs" @click="open = false">
        Close
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script>
import _ from 'lodash';

export default {
  name: 'error-notification',
  data: () => ({
    open: false,
  }),
  props: ['error'],
  watch: {
    error: function (newError, oldError) {
      this.open = _.isString(newError) && !_.isEqual(newError, oldError);
    },
  },
};
</script>
