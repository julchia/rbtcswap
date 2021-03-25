import _ from 'lodash';
import { get } from '../shared';
import { NAMES, remove } from '../../utils/cookies';

export default ({ id }) => {
  return get(`/order/${id}`)
    .then(({ data }) => {
      return data;
    })
    .catch(({ response }) => {
      const error = _.get(response, 'data.error', 'Error getting the order');
      const status = _.get(response, 'status');

      if (status === 404) {
        remove(NAMES.ORDER);
      }

      throw (error);
    });
}
