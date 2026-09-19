import { parseApiError, ApiError } from './api-error';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

type RequestOptions = {
  method?: string;
  body?: any;
  token?: string | null;
  headers?: Record<string, string>;
};

export async function api<T = any>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, token, headers = {} } = options;

  // Correlation ID – generated client-side, echoed by the API
  const requestId =
    (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-Id': requestId,
      ...headers,
    },
  };

  if (token) {
    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    config.body = JSON.stringify(body);
  }

  let res: Response;

  try {
    res = await fetch(`${API_URL}${endpoint}`, config);
  } catch (err) {
    // Network error (API down, CORS, etc.)
    throw new ApiError(
      'Impossible de contacter le serveur. Vérifiez votre connexion.',
      0,
    );
  }

  if (!res.ok) {
    // Auto-logout on 401
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('sos_token');
      localStorage.removeItem('sos_user');
      // Don't redirect on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    throw await parseApiError(res);
  }

  if (res.status === 204) {
    return null as T;
  }

  return res.json();
}

export { ApiError };

// ========== Auth ==========
export const authApi = {
  login: (email: string, password: string) =>
    api<{ access_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),
  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    api<{ access_token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: data,
    }),
};

// ========== Sessions ==========
export const sessionsApi = {
  findAll: (params?: { search?: string; futureOnly?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.futureOnly) query.set('futureOnly', 'true');
    return api<{ data: any[]; total: number }>(`/sessions?${query}`);
  },
  findOne: (id: number) => api(`/sessions/${id}`),
  create: (data: any, token: string) =>
    api('/sessions', { method: 'POST', body: data, token }),
  update: (id: number, data: any, token: string) =>
    api(`/sessions/${id}`, { method: 'PUT', body: data, token }),
  remove: (id: number, token: string) =>
    api(`/sessions/${id}`, { method: 'DELETE', token }),
};

// ========== Places ==========
export const placesApi = {
  findAll: (params?: { search?: string }, token?: string) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    return api<{ data: any[]; total: number }>(`/places?${query}`, { token });
  },
  findOne: (id: number, token: string) => api(`/places/${id}`, { token }),
  create: (data: any, token: string) =>
    api('/places', { method: 'POST', body: data, token }),
  update: (id: number, data: any, token: string) =>
    api(`/places/${id}`, { method: 'PUT', body: data, token }),
  remove: (id: number, token: string) =>
    api(`/places/${id}`, { method: 'DELETE', token }),
};

// ========== Users ==========
export const usersApi = {
  findAll: (params?: { search?: string; roleId?: number }, token?: string) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.roleId) query.set('roleId', String(params.roleId));
    return api<{ data: any[]; total: number }>(`/users?${query}`, { token });
  },
  findOne: (id: number, token: string) => api(`/users/${id}`, { token }),
  create: (data: any, token: string) =>
    api('/users', { method: 'POST', body: data, token }),
  update: (id: number, data: any, token: string) =>
    api(`/users/${id}`, { method: 'PUT', body: data, token }),
  remove: (id: number, token: string) =>
    api(`/users/${id}`, { method: 'DELETE', token }),
};

// ========== Registrations ==========
export const registrationsApi = {
  create: (data: any, token: string) =>
    api('/registrations', { method: 'POST', body: data, token }),
  findOne: (id: number, token: string) => api(`/registrations/${id}`, { token }),
  findAll: (params?: { sessionId?: number; userId?: number }, token?: string) => {
    const query = new URLSearchParams();
    if (params?.sessionId) query.set('sessionId', String(params.sessionId));
    if (params?.userId) query.set('userId', String(params.userId));
    return api(`/registrations?${query}`, { token });
  },
};

// ========== Payments ==========
export const paymentsApi = {
  create: (registrationId: number, amount: number, token: string, method: 'CARD' | 'TRANSFER' = 'CARD') =>
    api<{
      paymentId: number;
      tracker: string;
      amount: number;
      currency: string;
      method: string;
      paymentUrl?: string;
      redirectUrl?: string;
      bankTransfer?: {
        bankName: string;
        iban: string;
        bic: string;
        holder: string;
        reference: string;
      };
    }>('/payments', {
      method: 'POST',
      body: { registrationId, amount, method },
      token,
    }),
  confirmTransfer: (paymentId: number, token: string) =>
    api('/payments/' + paymentId + '/confirm-transfer', { method: 'POST', token }),
  pendingTransfers: (token: string) =>
    api('/payments/pending-transfers', { token }),
};
