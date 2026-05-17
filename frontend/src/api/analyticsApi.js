import api from './axios';

export const getOrdersSummary = () => api.get('/orders/analytics/summary');
export const getOrdersStatusBreakdown = () => api.get('/orders/analytics/status-breakdown');
export const getUsersSummary = () => api.get('/admin/users/summary');
export const getStockSummary = () => api.get('/inventory/analytics/stock-summary');
export const getPartnerSummary = () => api.get('/deliveries/analytics/partner-summary');
export const getPaymentSummary = () => api.get('/payments/analytics/summary');
export const getAllOrders = () => api.get('/orders/all');
