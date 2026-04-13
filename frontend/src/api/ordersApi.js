import api from './axios';

export const createOrder = (data) =>
  api.post('/orders', data);

export const getOrders = (params) =>
  api.get('/orders', { params });

export const getOrderById = (id) =>
  api.get(`/orders/${id}`);

export const updateOrderStatus = (id, status) =>
  api.put(`/orders/${id}/status`, null, { params: { status } });

export const cancelOrder = (id) =>
  api.put(`/orders/${id}/cancel`);
