<template>
  <v-app>
    <v-app-bar app color="#FFFFFF" height="100">
      <router-link class="app__header__link" to="/">
        <v-img
          alt="rBTC-Swap Logo"
          class="shrink mr-2"
          contain
          src="./assets/logo.png"
          transition="scale-transition"
          width="100"
        />
      </router-link>

      <div class="d-flex align-center flex-column">
        <div class="text-h4 font-weight-bold">rBTC Swap</div>
        <div class="app__header__subtitle font-weight-bold" v-if="isTestnet">
          Testnet
        </div>
      </div>

      <v-spacer></v-spacer>
    </v-app-bar>

    <v-main>
      <router-view class="background"></router-view>
    </v-main>
  </v-app>
</template>

<script>
const BLOCKCHAIN_ENV = process.env.VUE_APP_BLOCKCHAIN_ENV;

export default {
  name: 'App',

  data: () => ({
    isTestnet: BLOCKCHAIN_ENV === 'testnet',
  }),
};
</script>

<style>
.background {
  max-width: 1200px;
}
</style>
