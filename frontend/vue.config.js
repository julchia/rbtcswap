module.exports = {
  devServer: {
    //host: '0.0.0.0',
    //disableHostCheck: true,
    port: 5556,
    compress: true,
    public: 'fastbtc.emdx.io', // That solved it
    proxy: {
      '^/sockjs-node': {
        target: process.env.VUE_APP_BACKEND_URL,
        ws: true,
        changeOrigin: true
      }
    },
  },
  transpileDependencies: [
    'vuetify'
  ],
  runtimeCompiler: true,
  outputDir: "../backend/dist"
}
