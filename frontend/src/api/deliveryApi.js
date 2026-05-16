import api from './axios';

export const getAllDeliveries = () =>
  api.get('/deliveries');

export const getDeliveriesByPartner = (partnerId) =>
  api.get(`/deliveries/partner/${partnerId}`);

export const getDeliveryByOrderId = (orderId) =>
  api.get(`/deliveries/${orderId}`);

export const updateDeliveryStatus = (deliveryId, status) =>
  api.patch(`/deliveries/${deliveryId}/status`, { status });

export const updatePartnerAvailability = (partnerId, status) =>
  api.put(`/deliveries/partner/${partnerId}/availability`, null, {
    params: { status },
  });
