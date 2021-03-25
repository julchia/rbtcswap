import _ from 'lodash';
import { post } from '../shared';

export default (order) => {
  return post('/order', order)
    .then(({ data }) => {
      return data;
    })
    .catch(({ response }) => {
      const error = _.get(response, 'data.error', 'Error creating the order');

      throw (error);
    });
}
