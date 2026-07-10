import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const authConfig = (token, params) => ({
  headers: {
    Authorization: `Bearer ${token}`
  },
  params
});

export const getBrands = (token, params) => axios.get(`${API_URL}/brands`, authConfig(token, params));

export const getBrandById = (token, brandId) => axios.get(`${API_URL}/brands/${brandId}`, authConfig(token));

export const createBrand = (token, payload) => axios.post(`${API_URL}/brands`, payload, authConfig(token));

export const updateBrand = (token, brandId, payload) => axios.put(`${API_URL}/brands/${brandId}`, payload, authConfig(token));

export const updateBrandStatus = (token, brandId, status) =>
  axios.patch(`${API_URL}/brands/${brandId}/status`, { status }, authConfig(token));
