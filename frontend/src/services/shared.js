import axios from 'axios';

const API_URL = process.env.VUE_APP_API_URL;

export const httpDelete = (endpoint, data = {}) => {
  return axios.delete(`${API_URL}${endpoint}`, {
    data
  });
}

export const get = (endpoint, params = {}) => {
  return axios.get(`${API_URL}${endpoint}`, {
    params
  });
}

export const post = (endpoint, params, options = {}) => {
  return axios.post(`${API_URL}${endpoint}`, params, {
    ...options
  });
}

export const put = (endpoint, params, options = {}) => {
  return axios.put(`${API_URL}${endpoint}`, params, {
    ...options
  });
}
