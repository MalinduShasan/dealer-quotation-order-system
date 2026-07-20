import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const authConfig = (token, params) => ({
  headers: {
    Authorization: `Bearer ${token}`
  },
  params
});

export const getQuotations = (token, params) =>
  axios.get(`${API_URL}/quotations`, authConfig(token, params));

export const getQuotationById = (token, quotationId) =>
  axios.get(`${API_URL}/quotations/${quotationId}`, authConfig(token));

export const getQuotationHistory = (token, quotationId) =>
  axios.get(`${API_URL}/quotations/${quotationId}/history`, authConfig(token));

export const createQuotation = (token, payload) =>
  axios.post(`${API_URL}/quotations`, payload, authConfig(token));

export const updateQuotation = (token, quotationId, payload) =>
  axios.put(`${API_URL}/quotations/${quotationId}`, payload, authConfig(token));

const actionPost = (token, quotationId, action, payload = {}) =>
  axios.post(`${API_URL}/quotations/${quotationId}/${action}`, payload, authConfig(token));

export const submitQuotation = (token, quotationId) => actionPost(token, quotationId, "submit");
export const approveQuotation = (token, quotationId, reason) => actionPost(token, quotationId, "approve", { reason });
export const rejectQuotation = (token, quotationId, reason) => actionPost(token, quotationId, "reject", { reason });
export const sendQuotation = (token, quotationId) => actionPost(token, quotationId, "send");
export const acceptQuotation = (token, quotationId) => actionPost(token, quotationId, "accept");
export const declineQuotation = (token, quotationId, reason) => actionPost(token, quotationId, "decline", { reason });
export const cancelQuotation = (token, quotationId, reason) => actionPost(token, quotationId, "cancel", { reason });
export const duplicateQuotation = (token, quotationId) => actionPost(token, quotationId, "duplicate");

export const convertQuotationToOrder = (token, quotationId) =>
  axios.post(`${API_URL}/orders/from-quotation/${quotationId}`, {}, authConfig(token));
