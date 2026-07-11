import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const authConfig = (token, params) => ({
  headers: {
    Authorization: `Bearer ${token}`
  },
  params
});

export const getInventory = (token, params) => axios.get(`${API_URL}/inventory`, authConfig(token, params));
export const getLowStockProducts = (token, params) => axios.get(`${API_URL}/inventory/low-stock`, authConfig(token, params));
export const getInventoryMovements = (token, params) => axios.get(`${API_URL}/inventory/movements`, authConfig(token, params));
export const getProductInventoryMovements = (token, productId, params) =>
  axios.get(`${API_URL}/inventory/products/${productId}/movements`, authConfig(token, params));

export const restockProduct = (token, payload) =>
  axios.post(`${API_URL}/inventory/restock`, payload, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

export const adjustProductStock = (token, payload) =>
  axios.post(`${API_URL}/inventory/adjustment`, payload, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
