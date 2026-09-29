import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

export const mediaUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${BACKEND_URL}${path}`;
};

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ss_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

// ---- Public content ----
export const getServices = () => api.get("/services").then((r) => r.data);
export const getPublicSettings = () => api.get("/settings/public").then((r) => r.data);
export const getFaq = () => api.get("/faq").then((r) => r.data);
export const getGallery = () => api.get("/gallery").then((r) => r.data);
export const getReviews = () => api.get("/reviews").then((r) => r.data);
export const calculatePrice = (items) => api.post("/pricing/calculate", { items }).then((r) => r.data);
export const sendContact = (payload) => api.post("/contact", payload).then((r) => r.data);

// ---- Uploads ----
export const uploadImages = (files) => {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  return api.post("/uploads", fd, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
};

// ---- Orders ----
export const createOrder = (payload) => api.post("/orders", payload).then((r) => r.data);
export const getOrder = (orderNumber, token) =>
  api.get(`/orders/${orderNumber}`, { params: token ? { token } : {} }).then((r) => r.data);
export const addOrderPhotos = (orderNumber, token, photos) =>
  api.post(`/orders/${orderNumber}/photos`, { token, photos }).then((r) => r.data);
export const checkoutOrder = (orderNumber, token, originUrl) =>
  api.post(`/orders/${orderNumber}/checkout`, { token, origin_url: originUrl }).then((r) => r.data);
export const getPaymentStatus = (sessionId) => api.get(`/payments/status/${sessionId}`).then((r) => r.data);
export const getMyOrders = () => api.get("/my/orders").then((r) => r.data);

// ---- Auth ----
export const login = (payload) => api.post("/auth/login", payload).then((r) => r.data);
export const register = (payload) => api.post("/auth/register", payload).then((r) => r.data);
export const getMe = () => api.get("/auth/me").then((r) => r.data);

// ---- Admin ----
export const adminDashboard = () => api.get("/admin/dashboard").then((r) => r.data);
export const adminListOrders = (params) => api.get("/admin/orders", { params }).then((r) => r.data);
export const adminGetOrder = (orderNumber) => api.get(`/admin/orders/${orderNumber}`).then((r) => r.data);
export const adminApprove = (n, note) => api.post(`/admin/orders/${n}/approve`, { note }).then((r) => r.data);
export const adminDecline = (n, note) => api.post(`/admin/orders/${n}/decline`, { note }).then((r) => r.data);
export const adminRequestPhotos = (n, note) => api.post(`/admin/orders/${n}/request-photos`, { note }).then((r) => r.data);
export const adminSetStatus = (n, status, note) => api.post(`/admin/orders/${n}/status`, { status, note }).then((r) => r.data);
export const adminSetPrice = (n, payload) => api.post(`/admin/orders/${n}/price`, payload).then((r) => r.data);
export const adminGenerateLabel = (n, type) => api.post(`/admin/orders/${n}/label/generate`, { type }).then((r) => r.data);
export const adminManualLabel = (n, fd) => api.post(`/admin/orders/${n}/label/manual`, fd, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
export const adminRefund = (n, amount) => api.post(`/admin/orders/${n}/refund`, { amount }).then((r) => r.data);
export const adminContactCustomer = (n, payload) => api.post(`/admin/orders/${n}/contact`, payload).then((r) => r.data);
export const adminDeleteOrder = (n) => api.delete(`/admin/orders/${n}`).then((r) => r.data);
export const adminGetSettings = () => api.get("/admin/settings").then((r) => r.data);
export const adminUpdateSettings = (payload) => api.put("/admin/settings", payload).then((r) => r.data);
export const adminAddFaq = (p) => api.post("/admin/faq", p).then((r) => r.data);
export const adminUpdateFaq = (id, p) => api.put(`/admin/faq/${id}`, p).then((r) => r.data);
export const adminDeleteFaq = (id) => api.delete(`/admin/faq/${id}`).then((r) => r.data);
export const adminAddGallery = (p) => api.post("/admin/gallery", p).then((r) => r.data);
export const adminDeleteGallery = (id) => api.delete(`/admin/gallery/${id}`).then((r) => r.data);
export const adminReviews = () => api.get("/admin/reviews").then((r) => r.data);
export const adminAddReview = (p) => api.post("/admin/reviews", p).then((r) => r.data);
export const adminUpdateReview = (id, p) => api.put(`/admin/reviews/${id}`, p).then((r) => r.data);
export const adminDeleteReview = (id) => api.delete(`/admin/reviews/${id}`).then((r) => r.data);
export const adminMessages = () => api.get("/admin/messages").then((r) => r.data);
export const adminEmails = () => api.get("/admin/emails").then((r) => r.data);

// ---- Tickets / conversations ----
export const adminListTickets = (params) => api.get("/admin/tickets", { params }).then((r) => r.data);
export const adminTicketsUnread = () => api.get("/admin/tickets/unread-count").then((r) => r.data);
export const adminGetTicket = (id) => api.get(`/admin/tickets/${id}`).then((r) => r.data);
export const adminReplyTicket = (id, body) => api.post(`/admin/tickets/${id}/reply`, { body }).then((r) => r.data);
export const adminSetTicketStatus = (id, status) => api.post(`/admin/tickets/${id}/status`, { status }).then((r) => r.data);
export const adminDeleteTicket = (id) => api.delete(`/admin/tickets/${id}`).then((r) => r.data);
// customer-facing
export const getConversation = (id, token) => api.get(`/conversations/${id}`, { params: { token } }).then((r) => r.data);
export const replyConversation = (id, token, body) => api.post(`/conversations/${id}/messages`, { token, body }).then((r) => r.data);
