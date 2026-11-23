const API_BASE = typeof window !== "undefined" && window.location.hostname ? `http://${window.location.hostname}:5000/api` : "http://127.0.0.1:5000/api";

function getAuthHeaders() {
  const token = localStorage.getItem("techavenue_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
}

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : getAuthHeaders()),
    ...(options.headers || {})
  };

  if (isFormData) {
    const token = localStorage.getItem("techavenue_token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, { ...options, headers });

    if (res.status === 401) {
      localStorage.removeItem("techavenue_token");
      localStorage.removeItem("techavenue_user");
      window.dispatchEvent(new Event("auth_invalid"));
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  // Auth
  login: (email, password) => apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  }),
  switchRole: (role) => apiRequest("/auth/switch-role", {
    method: "POST",
    body: JSON.stringify({ role })
  }),
  getMe: () => apiRequest("/auth/me"),

  // Dashboard stats
  getDashboardStats: (role) => apiRequest(`/dashboard/stats?role=${role}`),

  // Inventory & Products
  getInventory: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/inventory?${q}`);
  },
  addProduct: (productData) => apiRequest("/inventory", {
    method: "POST",
    body: JSON.stringify(productData)
  }),
  updateProduct: (id, productData) => apiRequest(`/inventory/${id}`, {
    method: "PUT",
    body: JSON.stringify(productData)
  }),
  deleteProduct: (id) => apiRequest(`/inventory/${id}`, { method: "DELETE" }),
  uploadProductImage: (id, formData) => apiRequest(`/products/${id}/image`, {
    method: "POST",
    body: formData
  }),
  getProductImages: (id) => apiRequest(`/products/${id}/images`),
  stockIn: (data) => apiRequest("/inventory/stock-in", {
    method: "POST",
    body: JSON.stringify(data)
  }),
  stockOut: (data) => apiRequest("/inventory/stock-out", {
    method: "POST",
    body: JSON.stringify(data)
  }),
  getMovements: () => apiRequest("/inventory/movements"),

  // New Transaction — Draft Management
  getDrafts: () => apiRequest("/transactions/drafts"),
  getDraftDetail: (id) => apiRequest(`/transactions/drafts/${id}`),
  saveDraft: (data) => apiRequest("/transactions/drafts", {
    method: "POST",
    body: JSON.stringify(data)
  }),
  updateDraft: (id, data) => apiRequest(`/transactions/drafts/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  }),
  cancelDraft: (id) => apiRequest(`/transactions/drafts/${id}`, { method: "DELETE" }),

  // Point of Sale (POS)
  getPosProducts: () => apiRequest("/pos/products"),
  getPosDrafts: () => apiRequest("/pos/drafts"),
  posCheckout: (data) => apiRequest("/pos/checkout", {
    method: "POST",
    body: JSON.stringify(data)
  }),
  checkout: (data) => apiRequest("/pos/checkout", {
    method: "POST",
    body: JSON.stringify(data)
  }),
  getSalesHistory: () => apiRequest("/sales"),
  getReceipt: (id) => apiRequest(`/sales/${id}/receipt`),
  getCurrentShift: () => apiRequest("/sales/shift/current"),
  openShift: (startingCash) => apiRequest("/sales/shift/open", {
    method: "POST",
    body: JSON.stringify({ starting_cash: startingCash })
  }),
  closeShift: () => apiRequest("/sales/shift/close", { method: "POST" }),

  // Supplier & Purchasing Management
  getPurchasingDashboard: () => apiRequest("/purchasing/dashboard"),
  getSuppliers: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/suppliers?${q}`);
  },
  createSupplier: (data) => apiRequest("/suppliers", {
    method: "POST",
    body: JSON.stringify(data)
  }),
  addSupplier: (data) => apiRequest("/suppliers", {
    method: "POST",
    body: JSON.stringify(data)
  }),
  updateSupplier: (id, data) => apiRequest(`/suppliers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  }),
  toggleSupplierStatus: (id, status) => apiRequest(`/suppliers/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status })
  }),
  updateSupplierStatus: (id, status) => apiRequest(`/suppliers/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status })
  }),
  getSupplierOrders: (id) => apiRequest(`/suppliers/${id}/orders`),
  // NEW: Delete a supplier
  deleteSupplier: (id) => apiRequest(`/suppliers/${id}`, { method: "DELETE" }),

  // Purchase Orders & Receiving
  getPurchaseOrders: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/purchasing/orders?${q}`);
  },
  getPurchaseOrder: (id) => apiRequest(`/purchasing/orders/${id}`),
  getPurchaseOrderDetail: (id) => apiRequest(`/purchasing/orders/${id}`),
  createPurchaseOrder: (data) => apiRequest("/purchasing/orders", {
    method: "POST",
    body: JSON.stringify(data)
  }),
  updatePoStatus: (id, status) => apiRequest(`/purchasing/orders/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status })
  }),
  updatePurchaseOrderStatus: (id, status) => apiRequest(`/purchasing/orders/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status })
  }),
  receivePoStock: (id, data) => apiRequest(`/purchasing/orders/${id}/receive`, {
    method: "POST",
    body: JSON.stringify(data)
  }),
  receivePurchaseOrderStock: (id, data) => apiRequest(`/purchasing/orders/${id}/receive`, {
    method: "POST",
    body: JSON.stringify(data)
  }),

  // Business Reports & Analytics (No ML)
  getReportsAnalytics: () => apiRequest("/reports/analytics"),

  // User Administration (Admin)
  getUsers: () => apiRequest("/users"),
  createUser: (userData) => apiRequest("/users", {
    method: "POST",
    body: JSON.stringify(userData)
  })
};