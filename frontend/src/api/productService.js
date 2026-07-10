import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const authConfig = (token, params) => ({
  headers: {
    Authorization: `Bearer ${token}`
  },
  params
});

export const getProducts = (token, params) => axios.get(`${API_URL}/products`, authConfig(token, params));

export const getProductById = (token, productId) => axios.get(`${API_URL}/products/${productId}`, authConfig(token));

export const createProduct = (token, payload) => axios.post(`${API_URL}/products`, payload, authConfig(token));

export const updateProduct = (token, productId, payload) =>
  axios.put(`${API_URL}/products/${productId}`, payload, authConfig(token));

export const updateProductStatus = (token, productId, status) =>
  axios.patch(`${API_URL}/products/${productId}/status`, { status }, authConfig(token));

export const uploadProductImage = (token, productId, file) => {
  const formData = new FormData();
  formData.append("image", file);

  return axios.post(`${API_URL}/products/${productId}/image`, formData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const deleteProductImage = (token, productId) =>
  axios.delete(`${API_URL}/products/${productId}/image`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
