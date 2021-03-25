<template>
  <qrcode :size="parseInt(100)" :text="text" class="qr-code"></qrcode>
</template>

<script>
import Vue from 'vue';
import VueQRCodeComponent from 'vue-qr-generator';

Vue.component('qrcode', VueQRCodeComponent);

export default {
  name: 'qr-code',
  props: ['text'],
};
</script>

<style scoped>
.qr-code {
  border: 2px white solid;
}
</style>
