import api from './axios';

export const login = (credentials) =>
  api.post('/auth/login', credentials);

export const register = (userData) =>
  api.post('/auth/signup', userData);

export const sendOtp = (data) =>
  api.post('/auth/send-otp', data);

export const verifyOtp = (data) =>
  api.post('/auth/verify-otp', data);
