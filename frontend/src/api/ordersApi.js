import api from './axios';

export const createOrder = (orderData) =>
  api.post('/orders', orderData);

export const getOrders = (params) =>
  api.get('/orders', { params });

export const getOrderById = (id) =>
  api.get(`/orders/${id}`);

export const cancelOrder = (id) =>
  api.put(`/orders/${id}/cancel`);

export const updateOrderStatus = (id, status) =>
  api.put(`/orders/${id}/status`, null, {
    params: { status }
  });
