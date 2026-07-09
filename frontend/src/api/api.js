import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const loginUser = (data) => axios.post(`${API_URL}/users/login`, data);

export const getPendingQuotations = (token) =>
  axios.get(`${API_URL}/dealer/quotations`, {
    headers: { Authorization: `Bearer ${token}` }
  });
