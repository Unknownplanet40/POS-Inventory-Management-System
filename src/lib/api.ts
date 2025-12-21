/**
 * API Service for communicating with NestJS backend
 * Base URL: http://localhost:3000
 */

const API_BASE_URL = 'http://localhost:3000/api';
let authToken: string | null = null;

export function setAuthToken(token: string) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

export function clearAuthToken() {
  authToken = null;
}

async function apiCall(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any,
) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  } catch (err: any) {
    const message = err?.message || 'Unable to reach server';
    const error = new Error(message) as Error & { code?: string };
    error.code = 'BACKEND_UNREACHABLE';
    throw error;
  }

  if (!response.ok) {
    let errorMessage = `API Error: ${response.statusText}`;
    try {
      const error = await response.json();
      errorMessage = error.message || errorMessage;
    } catch {
      // ignore parse errors
    }
    const error = new Error(errorMessage) as Error & { code?: string };
    error.code = 'API_ERROR';
    throw error;
  }

  return response.json();
}

// ==================== AUTH ====================
export const authAPI = {
  register: async (username: string, password: string, role: 'admin' | 'cashier') => {
    return apiCall('/auth/register', 'POST', { username, password, role });
  },

  login: async (username: string, password: string) => {
    return apiCall('/auth/login', 'POST', { username, password });
  },
};

// ==================== PRODUCTS ====================
export const productsAPI = {
  create: async (data: { name: string; barcode: string; price: number; stock: number; imageUrl?: string; image?: File }) => {
    if (data.image) {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('barcode', data.barcode);
      formData.append('price', data.price.toString());
      formData.append('stock', data.stock.toString());
      formData.append('image', data.image);

      const headers: HeadersInit = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `API Error: ${response.statusText}`;
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }

      return response.json();
    }
    return apiCall('/products', 'POST', data);
  },

  getAll: async () => {
    return apiCall('/products', 'GET');
  },

  getByBarcode: async (barcode: string) => {
    return apiCall(`/products/barcode/${barcode}`, 'GET');
  },

  getById: async (id: string) => {
    return apiCall(`/products/${id}`, 'GET');
  },

  update: async (id: string, data: { name?: string; price?: number; stock?: number; imageUrl?: string; image?: File }) => {
    if (data.image) {
      const formData = new FormData();
      if (data.name) formData.append('name', data.name);
      if (data.price !== undefined) formData.append('price', data.price.toString());
      if (data.stock !== undefined) formData.append('stock', data.stock.toString());
      formData.append('image', data.image);

      const headers: HeadersInit = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers,
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `API Error: ${response.statusText}`;
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }

      return response.json();
    }
    return apiCall(`/products/${id}`, 'PUT', data);
  },

  delete: async (id: string) => {
    return apiCall(`/products/${id}`, 'DELETE');
  },

  restore: async (id: string) => {
    return apiCall(`/products/${id}/restore`, 'PUT');
  },

  permanentDelete: async (id: string) => {
    return apiCall(`/products/${id}/permanent`, 'DELETE');
  },
};

// ==================== USERS ====================
export const usersAPI = {
  getAll: async () => {
    return apiCall('/users', 'GET');
  },

  getById: async (id: string) => {
    return apiCall(`/users/${id}`, 'GET');
  },

  update: async (id: string, data: { role?: 'admin' | 'cashier'; password?: string }) => {
    return apiCall(`/users/${id}`, 'PUT', data);
  },

  delete: async (id: string) => {
    return apiCall(`/users/${id}`, 'DELETE');
  },

  reactivate: async (id: string) => {
    return apiCall(`/users/${id}/reactivate`, 'PUT');
  },
};

// ==================== SALES ====================
export const salesAPI = {
  create: async (data: {
    items: any[];
    subtotal: number;
    discountType: 'percentage' | 'fixed' | null;
    discountValue: number;
    discountAmount: number;
    taxRate?: number;
    taxAmount?: number;
    total: number;
    cashierId: string;
    cashierName: string;
  }) => {
    return apiCall('/sales', 'POST', data);
  },

  getAll: async (startDate?: Date, endDate?: Date) => {
    let endpoint = '/sales';
    if (startDate && endDate) {
      const start = startDate.toISOString();
      const end = endDate.toISOString();
      endpoint += `?startDate=${start}&endDate=${end}`;
    }
    return apiCall(endpoint, 'GET');
  },

  getByCashier: async (cashierId: string) => {
    return apiCall(`/sales/cashier/${cashierId}`, 'GET');
  },

  clearAll: async () => {
    return apiCall('/sales/clear', 'DELETE');
  },
};

// ==================== SETTINGS ====================
export const settingsAPI = {
  get: async () => {
    return apiCall('/settings', 'GET');
  },

  save: async (data: {
    isSetupComplete?: boolean;
    storeName?: string;
    storeLogoUrl?: string;
    storeEmail?: string;
    storePhone?: string;
    storeAddress?: string;
    storeDescription?: string;
    currency?: string;
    taxRate?: number;
    categories?: string[];
  }) => {
    return apiCall('/settings', 'POST', data);
  },

  uploadLogo: async (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);

    const headers: HeadersInit = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/settings/logo`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `API Error: ${response.statusText}`;
      try {
        const error = await response.json();
        errorMessage = error.message || errorMessage;
      } catch {}
      throw new Error(errorMessage);
    }

    return response.json();
  },

  reset: async () => {
    return apiCall('/settings/reset', 'DELETE');
  },

  backup: async () => {
    return apiCall('/settings/backup', 'GET');
  },

  restore: async (data: any) => {
    return apiCall('/settings/restore', 'POST', data);
  },
};
