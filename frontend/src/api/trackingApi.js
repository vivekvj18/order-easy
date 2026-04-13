import api from './axios';

export const updateTracking = (data) =>
  api.post('/tracking/update', data);

export const getLatestTracking = (orderId) =>
  api.get(`/tracking/${orderId}`);

export const getTrackingHistory = (orderId) =>
  api.get(`/tracking/${orderId}/history`);
