import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const authConfig = (token, params) => ({
  headers: {
    Authorization: `Bearer ${token}`
  },
  params
});

export const getCategories = (token, params) =>
  axios.get(`${API_URL}/categories`, authConfig(token, params));

export const getCategoryById = (token, categoryId) =>
  axios.get(`${API_URL}/categories/${categoryId}`, authConfig(token));

export const createCategory = (token, payload) =>
  axios.post(`${API_URL}/categories`, payload, authConfig(token));

export const updateCategory = (token, categoryId, payload) =>
  axios.put(`${API_URL}/categories/${categoryId}`, payload, authConfig(token));

export const updateCategoryStatus = (token, categoryId, status) =>
  axios.patch(`${API_URL}/categories/${categoryId}/status`, { status }, authConfig(token));
