import Vue from 'vue';
import Rbank from '@rsksmart/rbank';
import rlending from '@riflending/riflending-js';
import App from './App.vue';
import './registerServiceWorker';
import router from './router';
import store from './store';
import vuetify from './plugins/vuetify';
import 'roboto-fontface/css/roboto/roboto-fontface.css';
import '@mdi/font/css/materialdesignicons.css';
import './styles/main.scss';

require('./filters');

Vue.config.productionTip = false;
// eslint-disable-next-line no-multi-assign
Vue.prototype.$rbank = Vue.rbank = new Rbank(
  {
    [process.env.VUE_APP_NETWORK_ID]: process.env.VUE_APP_WS_PROVIDER,
  },
);
new Vue({
  router,
  store,
  vuetify,
  render: (h) => h(App),
}).$mount('#app');
const cRif = rlending.util.getAddress(rlending.cRif);
console.log('cRIF default address LALALA', cRif);

