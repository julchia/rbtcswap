import Cookies from 'js-cookie';

export const NAMES = {
  'ORDER': 'order'
};
const options = {
  expires: 365
};

export function set(name, value) {
  Cookies.set(name, value, options);
}

export function get(name) {
  return Cookies.get(name, options);
}

export function remove(name) {
  Cookies.remove(name);
}
