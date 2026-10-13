import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.geezplay.site';
export const API_BASE_URL = API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  },
);

// Auth
export const login = (email: string, password: string) => api.post('/auth/login', { email, password });
export const register = (name: string, email: string, password: string) =>
  api.post('/auth/register', { name, email, password });
export const logout = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me');
export const updateProfile = (data: { name?: string; password?: string }) => api.put('/auth/profile', data);
export const googleLoginUrl = () => `${API_URL}/auth/google`;

// Events (Public)
export const getEvents = () => api.get('/events');
export const getEvent = (id: string | number | undefined) => api.get(`/events/${id}`);

// Photos (Public)
export const getPhotosByClass = (eventId: string | number | undefined, className: string | undefined, params: Record<string, unknown> = {}) =>
  api.get(`/photos/event/${eventId}/class/${encodeURIComponent(String(className))}`, { params });
export const getClassPhotos = (eventId: string | number | undefined, className: string | undefined) =>
  api.get(`/photos/event/${eventId}/class/${encodeURIComponent(String(className))}`);
export const getPhoto = (id: string | number | undefined) => api.get(`/photos/${id}`);

// Orders
export const createOrder = (data: unknown) => api.post('/orders', data);
export const getOrder = (id: string | number | undefined, token?: string | null) =>
  api.get(`/orders/${id}`, { params: token ? { token } : {} });
export const getMyOrders = () => api.get('/orders/my');
export const updateOrderStatus = (id: string | number | undefined, status: string) => api.put(`/orders/${id}/status`, { status });

// Payment (Midtrans)
export const createPayment = (orderId: number) => api.post('/payment/create-payment', { orderId });
export const chargePayment = (orderId: number, paymentMethod: string) => api.post('/payment/charge', { orderId, paymentMethod });
export const checkPaymentStatus = (orderId: string | number | undefined, token?: string | null) =>
  api.get(`/payment/check-status/${orderId}`, { params: token ? { token } : {} });
export const createPaymentToken = createPayment;

// Discount
export const validateDiscount = (code: string, subtotal: number, items: unknown) =>
  api.post('/discounts/validate', { code, subtotal, items });
export const getDiscounts = () => api.get('/discounts');
export const createDiscount = (data: unknown) => api.post('/discounts', data);
export const updateDiscount = (id: number, data: unknown) => api.put(`/discounts/${id}`, data);
export const deleteDiscount = (id: number) => api.delete(`/discounts/${id}`);

// Admin - Dashboard
export const getDashboard = () => api.get('/admin/dashboard');
export const getTransactions = (params: Record<string, unknown> = {}) => api.get('/admin/transactions', { params });
export const getAdminTransactions = getTransactions;

// Admin - Events
export const getAdminEvents = () => api.get('/admin/events');
export const getApprovedEvents = () => api.get('/admin/events/all/approved');
export const getAdminEvent = (id: string | number | undefined) => api.get(`/admin/events/${id}`);
export const createEvent = (formData: FormData) => api.post('/admin/events', formData);
export const updateEvent = (id: string | number | undefined, formData: FormData) => api.put(`/admin/events/${id}`, formData);
export const deleteEvent = (id: string | number | undefined) => api.delete(`/admin/events/${id}`);

// Admin - Classes
export const createClass = (eventId: string | number | undefined, name: string) => api.post(`/admin/events/${eventId}/classes`, { name });
export const deleteClass = (id: number) => api.delete(`/admin/classes/${id}`);

// Admin - Photos
export const getAdminPhotos = () => api.get('/admin/photos');
export const getAdminPhoto = (id: string | number | undefined) => api.get(`/admin/photos/${id}`);
export const uploadPhoto = (formData: FormData) => api.post('/admin/photos', formData);
export const updatePhoto = (id: string | number | undefined, formData: FormData) => api.put(`/admin/photos/${id}`, formData);
export const deletePhoto = (id: string | number | undefined) => api.delete(`/admin/photos/${id}`);

// Admin - Recaps
export const uploadRecaps = (photoId: string | number | undefined, formData: FormData) =>
  api.post(`/admin/photos/${photoId}/recaps`, formData, { timeout: 300000 });
export const deleteRecap = (id: number) => api.delete(`/admin/recaps/${id}`);
export const regenerateClassPreview = (eventId: number, className: string) =>
  api.post('/admin/class-previews/regenerate', { eventId, className });
export const getClassPreviews = (eventId?: number) =>
  api.get('/admin/class-previews', { params: eventId ? { eventId } : {} });

// Admin - Pending Events
export const getPendingEvents = () => api.get('/admin/pending-events');
export const approveEvent = (id: number) => api.post(`/admin/events/${id}/approve`);
export const rejectEvent = (id: number, reason?: string) => api.post(`/admin/events/${id}/reject`, { reason });

// Admin - Users
export const getAdminUsers = () => api.get('/admin/users');
export const getAdmins = getAdminUsers;
export const createAdminUser = (data: unknown) => api.post('/admin/users', data);
export const createAdmin = createAdminUser;
export const updateAdmin = (id: number, data: unknown) => api.put(`/admin/users/${id}`, data);
export const deleteAdminUser = (id: number) => api.delete(`/admin/users/${id}`);
export const deleteAdmin = deleteAdminUser;

// Admin - Sponsors
export const getSponsors = () => api.get('/admin/sponsors');
export const createSponsor = (formData: FormData) => api.post('/admin/sponsors', formData);
export const updateSponsor = (id: number, formData: FormData) => api.put(`/admin/sponsors/${id}`, formData);
export const deleteSponsor = (id: number) => api.delete(`/admin/sponsors/${id}`);

// Admin - Photographers
export const getPhotographers = () => api.get('/admin/photographers');
export const createPhotographer = (formData: FormData) => api.post('/admin/photographers', formData);
export const updatePhotographer = (id: number, formData: FormData) => api.put(`/admin/photographers/${id}`, formData);
export const deletePhotographer = (id: number) => api.delete(`/admin/photographers/${id}`);

// Admin - Settings
export const getSettings = () => api.get('/admin/settings');
export const updateSettings = (formData: FormData) => api.post('/admin/settings', formData);
export const removeLogo = () => api.delete('/admin/settings/logo');

// Admin - Balance & Withdrawals
export const getBalance = () => api.get('/admin/balance');
export const getAdminBalance = getBalance;
export const requestWithdrawal = (data: unknown) => api.post('/admin/withdrawals', data);
export const getWithdrawals = () => api.get('/admin/withdrawals');
export const getWithdrawalRequests = getWithdrawals;
export const approveWithdrawal = (id: number, notes?: string) => api.post(`/admin/withdrawals/${id}/approve`, { notes });
export const rejectWithdrawal = (id: number, notes?: string) => api.post(`/admin/withdrawals/${id}/reject`, { notes });

// Upcoming Events
export const getUpcomingEvents = () => api.get('/events/upcoming');
export const getAdminUpcomingEvents = () => api.get('/admin/upcoming-events');
export const getAdminUpcomingEvent = (id: string | number | undefined) => api.get(`/admin/upcoming-events/${id}`);
export const createUpcomingEvent = (formData: FormData) => api.post('/admin/upcoming-events', formData);
export const updateUpcomingEvent = (id: string | number | undefined, formData: FormData) => api.put(`/admin/upcoming-events/${id}`, formData);
export const deleteUpcomingEvent = (id: string | number | undefined) => api.delete(`/admin/upcoming-events/${id}`);
export const toggleEventPublish = (id: string | number | undefined) => api.patch(`/admin/upcoming-events/${id}/toggle-publish`);

export default api;
