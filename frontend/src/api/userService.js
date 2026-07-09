import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const authConfig = (token, params) => ({
  headers: {
    Authorization: `Bearer ${token}`
  },
  params
});

export const getUsers = (token, params) =>
  axios.get(`${API_URL}/users`, authConfig(token, params));

export const createUser = (token, payload) =>
  axios.post(`${API_URL}/users`, payload, authConfig(token));

export const updateUser = (token, userId, payload) =>
  axios.put(`${API_URL}/users/${userId}`, payload, authConfig(token));

export const updateUserStatus = (token, userId, status) =>
  axios.patch(`${API_URL}/users/${userId}/status`, { status }, authConfig(token));
