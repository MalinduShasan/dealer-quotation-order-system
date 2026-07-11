// src/api/api.js
import axios from "axios";

const API_URL = "http://localhost:5000/api";

export const registerUser = (data) => axios.post(`${API_URL}/users/register`, data);
export const loginUser = (data) => axios.post(`${API_URL}/users/login`, data);
export const getProducts = () => axios.get(`${API_URL}/products`);
export const createQuotation = (data, token) =>
  axios.post(`${API_URL}/quotations`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
export const getMyQuotations = (token) =>
  axios.get(`${API_URL}/quotations/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });
export const getPendingQuotations = (token) =>
  axios.get(`${API_URL}/dealer/quotations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
export const approveQuotation = (id, token) =>
  axios.patch(`${API_URL}/dealer/quotations/${id}/approve`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
export const rejectQuotation = (id, token) =>
  axios.patch(`${API_URL}/dealer/quotations/${id}/reject`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
export const placeOrderFromQuotation = (id, token) =>
  axios.post(`${API_URL}/orders/from-quotation/${id}`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
