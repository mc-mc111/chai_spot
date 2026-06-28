import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach token to requests if available
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('chaispot_user'));
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
};

export const shopAPI = {
  getAllShops: () => api.get('/shops'),
  getShopById: (id) => api.get(`/shops/${id}`),
  createShop: (data) => api.post('/shops', data),
  getDirections: (startLng, startLat, endLng, endLat) => 
    api.get(`/shops/directions?startLng=${startLng}&startLat=${startLat}&endLng=${endLng}&endLat=${endLat}`),
  geocodeStart: (address) => api.get(`/shops/geocode-start?address=${encodeURIComponent(address)}`),
  getAutocomplete: (query) => api.get(`/shops/autocomplete?q=${encodeURIComponent(query)}`)
};

export const reviewAPI = {
  getShopReviews: (shopId) => api.get(`/shops/${shopId}/reviews`),
  addReview: (shopId, data) => api.post(`/shops/${shopId}/reviews`, data),
  updateReview: (shopId, reviewId, data) => api.put(`/shops/${shopId}/reviews/${reviewId}`, data)
};

export const rewardAPI = {
  redeemCoupon: (shopId, pointsCost) => api.post('/rewards/redeem', { shopId, pointsCost })
};

export default api;
