import api from './axios';

export const getAllDeliveries = () =>
  api.get('/deliveries');

export const getDeliveryByOrderId = (orderId) =>
  api.get(`/deliveries/${orderId}`);

export const updatePartnerAvailability = (partnerId, status) =>
  api.put(`/deliveries/partner/${partnerId}/availability`, null, {
    params: { status },
  });
