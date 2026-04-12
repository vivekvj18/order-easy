import api from './axios';

export const getPartnerDeliveries = (partnerId) =>
  api.get(`/deliveries/partner/${partnerId}`);

export const updatePartnerAvailability = (partnerId, status) =>
  api.put(`/deliveries/partner/${partnerId}/availability`, null, {
    params: { status },
  });

export const getAllPartners = () =>
  api.get('/deliveries/partners');
