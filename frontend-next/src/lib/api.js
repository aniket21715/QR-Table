const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";
let memoryToken = null;
let memoryRestaurantName = null;


function normalizeToken(value) {
  if (!value) return null;
  const token = String(value).trim().replace(/^"|"$/g, "");
  if (!token || token === "null" || token === "undefined") return null;
  if (!token.includes(".")) return null;
  return token;
}

function normalizeRestaurantName(value) {
  if (!value) return null;
  const name = String(value).trim().replace(/^"|"$/g, "");
  return name || null;
}

export function getAuthToken() {
  if (memoryToken) return memoryToken;
  try {
    const stored = localStorage.getItem("admin_token");
    const normalized = normalizeToken(stored);
    if (!normalized && stored) {
      localStorage.removeItem("admin_token");
    }
    return normalized;
  } catch {
    return null;
  }
}

export function setAuthToken(token) {
  const normalized = normalizeToken(token);
  memoryToken = normalized;
  try {
    if (normalized) {
      localStorage.setItem("admin_token", normalized);
    } else {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("restaurant_name");
      memoryRestaurantName = null;
    }
  } catch {
    // Ignore storage errors (private mode or blocked storage).
  }
}

export function getRestaurantName() {
  if (memoryRestaurantName) return memoryRestaurantName;
  try {
    const stored = localStorage.getItem("restaurant_name");
    const normalized = normalizeRestaurantName(stored);
    if (!normalized && stored) {
      localStorage.removeItem("restaurant_name");
    }
    return normalized;
  } catch {
    return null;
  }
}

export function setRestaurantName(name) {
  const normalized = normalizeRestaurantName(name);
  memoryRestaurantName = normalized;
  try {
    if (normalized) {
      localStorage.setItem("restaurant_name", normalized);
    } else {
      localStorage.removeItem("restaurant_name");
    }
  } catch {
    // Ignore storage errors (private mode or blocked storage).
  }
}

async function apiFetch(path, options = {}) {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    if (response.status === 401) {
      setAuthToken(null);
    }
    let message = "";
    try {
      const data = await response.json();
      message = data?.detail || JSON.stringify(data);
    } catch {
      message = await response.text();
    }
    throw new Error(message || response.statusText);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const menuApi = {
  getMenu: (params = "") => apiFetch(`/menu/${params}`),
  getItems: (params = "") => apiFetch(`/menu/items${params}`),
  createItem: (payload) => apiFetch("/menu/items", { method: "POST", body: JSON.stringify(payload) }),
  updateItem: (id, payload) => apiFetch(`/menu/items/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteItem: (id) => apiFetch(`/menu/items/${id}`, { method: "DELETE" }),
  getCategories: (params = "") => apiFetch(`/menu/categories${params}`),
  createCategory: (payload) => apiFetch("/menu/categories", { method: "POST", body: JSON.stringify(payload) }),
  updateCategory: (id, payload) => apiFetch(`/menu/categories/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteCategory: (id) => apiFetch(`/menu/categories/${id}`, { method: "DELETE" })
};

export const orderApi = {
  list: (params = "") => apiFetch(`/orders/${params}`),
  get: (id) => apiFetch(`/orders/${id}`),
  create: (payload) => apiFetch("/orders/", { method: "POST", body: JSON.stringify(payload) }),
  updateStatus: (id, payload) => apiFetch(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify(payload) }),
  history: (params = "") => apiFetch(`/orders/history${params}`)
};

export const analyticsApi = {
  summary: () => apiFetch("/analytics/summary"),
  status: () => apiFetch("/analytics/status"),
  topItems: (limit = 5) => apiFetch(`/analytics/top-items?limit=${limit}`),
  byCategory: () => apiFetch("/analytics/by-category"),
  byHour: (days = 7) => apiFetch(`/analytics/by-hour?days=${days}`)
};

export const authApi = {
  me: () => apiFetch("/auth/me")
};

export const recommendationsApi = {
  trending: (restaurantId, limit = 5) =>
    apiFetch(`/recommendations/trending?restaurant_id=${restaurantId}&limit=${limit}`),
  fbt: (restaurantId, itemId, limit = 5) =>
    apiFetch(
      `/recommendations/fbt?restaurant_id=${restaurantId}&item_id=${itemId}&limit=${limit}`
    )
};

export const tablesApi = {
  list: () => apiFetch("/tables/"),
  create: (payload) => apiFetch("/tables/", { method: "POST", body: JSON.stringify(payload) }),
  delete: (id) => apiFetch(`/tables/${id}`, { method: "DELETE" }),
  qrUrl: (id) => `${API_BASE}/tables/${id}/qr`,
  // Generate the menu URL that the QR code redirects to
  menuUrl: (table) => {
    const query = new URLSearchParams({
      restaurant: String(table.restaurant_id),
      table: String(table.id),
      code: String(table.code)
    }).toString();
    if (typeof window === "undefined") {
      return `/menu?${query}`;
    }
    return `${window.location.origin}/menu?${query}`;
  },
  lookupByCode: (code) => apiFetch(`/tables/lookup?code=${encodeURIComponent(code)}`),
  publicList: (restaurantId = null) => {
    const param = restaurantId ? `?restaurant_id=${restaurantId}` : "";
    return apiFetch(`/tables/public${param}`);
  }
};

export function getWebSocketUrl(path) {
  const apiUrl = new URL(API_BASE);
  const wsProtocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
  return `${wsProtocol}//${apiUrl.host}${path}`;
}

