import _ from 'lodash';
import { createOrder, getOrder } from '@/services';
import { NAMES, set as setCookie } from '@/utils/cookies';

export default {
  namespaced: true,
  state: {
    creating: false,
    error: null,
    loading: false,
    order: {}
  },
  mutations: {
    BEFORE_CREATE(state) {
      state.creating = true;
      state.error = null;
      state.order = [];
    },
    SUCCESS_CREATE(state, order) {
      state.creating = false;
      state.order = order;
    },
    ERROR_CREATE(state, error) {
      state.creating = false;
      state.error = error;
    },
    BEFORE_FETCH(state) {
      state.error = null;
      state.loading = true;
    },
    SUCCESS_FETCH(state, order) {
      state.loading = false;
      state.order = order;
    },
    ERROR_FETCH(state, error) {
      state.loading = false;
      state.error = error;
    },
    CLEAN(state) {
      state.order = {};
    }
  },
  actions: {
    clean: ({ commit }) => {
      commit('CLEAN');
    },
    create: async ({ commit }, request) => {
      commit('BEFORE_CREATE');

      try {
        const response = await createOrder(request);
        const order = _.get(response, 'data.order');

        setCookie(NAMES.ORDER, order.id);

        commit('SUCCESS_CREATE', order);
      } catch (error) {
        commit('ERROR_CREATE', error);
      }
    },
    get: async ({ commit, state }, { id }) => {
      commit('BEFORE_FETCH');

      try {
        const currentOrder = _.get(state, 'order.id');
        const response = await getOrder({ id });
        const order = _.get(response, 'data.order');

        if (_.isEmpty(currentOrder) || _.isEqual(order.id, currentOrder)) {
          commit('SUCCESS_FETCH', order);
        }
      } catch (error) {
        commit('ERROR_FETCH', error);
      }
    },
  }
}
