import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const authConfig = (token, params) => ({
  headers: {
    Authorization: `Bearer ${token}`
  },
  params
});

export const getDealers = (token, params) =>
  axios.get(`${API_URL}/dealers`, authConfig(token, params));

export const getDealerById = (token, dealerId) =>
  axios.get(`${API_URL}/dealers/${dealerId}`, authConfig(token));

export const createDealer = (token, payload) =>
  axios.post(`${API_URL}/dealers`, payload, authConfig(token));

export const updateDealer = (token, dealerId, payload) =>
  axios.put(`${API_URL}/dealers/${dealerId}`, payload, authConfig(token));

export const updateDealerStatus = (token, dealerId, status) =>
  axios.patch(`${API_URL}/dealers/${dealerId}/status`, { status }, authConfig(token));
