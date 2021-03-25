<template>
  <v-dialog max-width="600" persistent v-model="show">
    <v-card>
      <v-card-title class="headline">
        Are you sure you want to clear the curent order?
      </v-card-title>
      <v-card-text
        >This action cannot be undone and you will have to open a new
        order.</v-card-text
      >
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="darken-1" text @click="onCancel"> Cancel </v-btn>
        <v-btn color="green darken-1" text @click="onConfirm"> Confirm </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import _ from 'lodash';

export default {
  name: 'confirmation-dialog',
  props: ['onCancel', 'onConfirm', 'show'],
  watch: {
    error: function (newVal, oldVal) {
      if (!_.isEqual(newVal, oldVal)) {
        this.open = true;
      }
    },
  },
};
</script>
