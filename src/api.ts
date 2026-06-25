export type AuthSession = {
  user: { id: string; email: string; firstName: string; lastName: string; role: string; emailVerified: boolean };
  tenant: { id: string; name: string; planType: string };
  tokens: { accessToken: string; refreshToken: string };
};

export type LoginPayload = { email: string; password: string; twoFactorCode?: string };
export type RegisterPayload = {
  companyName: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  ruc?: string;
  phone?: string;
  address?: string;
  planType: 'FREE' | 'STARTER' | 'BUSINESS' | 'ENTERPRISE';
};

const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:3000/api/v1';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const raw = localStorage.getItem('techsolutions.session');
    if (!raw) return null;
    const session = JSON.parse(raw) as AuthSession;
    const refreshToken = session.tokens.refreshToken;
    if (!refreshToken) return null;
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) {
      localStorage.removeItem('techsolutions.session');
      window.dispatchEvent(new CustomEvent('techsolutions:unauthorized'));
      return null;
    }
    const payload = (await response.json()) as AuthSession;
    localStorage.setItem('techsolutions.session', JSON.stringify(payload));
    return payload.tokens.accessToken;
  } catch {
    return null;
  } finally {
    refreshPromise = null;
  }
}

async function doFetch(path: string, options: RequestInit, token?: string): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  let response = await doFetch(path, options, token);

  if (response.status === 401 && token) {
    refreshPromise ??= refreshAccessToken();
    const newToken = await refreshPromise;
    if (newToken) {
      response = await doFetch(path, options, newToken);
    }
  }

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = (payload as Record<string, string>).error ?? (payload as Record<string, string>).message ?? 'No se pudo completar la solicitud';
    throw new ApiError(message, response.status);
  }
  return payload as T;
}

export const api = {
  baseUrl: API_URL,
  login: (payload: LoginPayload) =>
    request<AuthSession>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload: RegisterPayload) =>
    request<AuthSession>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  plans: () => request<{ data: unknown[] }>('/subscriptions/plans'),
  kpis: (token: string) => request<{ data: unknown }>('/dashboard/kpis', {}, token),
  trend: (token: string, days = 12) => request<{ data: unknown[] }>(`/dashboard/sales-trend?days=${days}`, {}, token),
  sales: (token: string) => request<{ data: unknown[]; total: number }>('/sales?page=1&limit=20', {}, token),
  products: (token: string) => request<{ data: unknown[]; total: number }>('/inventory/products?page=1&limit=20', {}, token),
  createProduct: (token: string, payload: { name: string; sku?: string; price: number; cost?: number; stock: number; minStock: number; unit: string }) =>
    request<{ data: unknown }>('/inventory/products', { method: 'POST', body: JSON.stringify(payload) }, token),
  createCustomer: (token: string, payload: { name: string; email?: string; phone?: string; document?: string; documentType?: 'DNI' | 'RUC' | 'CE' | 'OTRO'; address?: string }) =>
    request<{ data: unknown }>('/customers', { method: 'POST', body: JSON.stringify(payload) }, token),
  createSale: (token: string, payload: { customerId?: string; items: Array<{ productId: string; quantity: number; unitPrice: number; discount: number }>; payments: Array<{ method: 'CASH' | 'CARD' | 'YAPE' | 'PLIN' | 'TRANSFER' | 'OTHER'; amount: number; reference?: string }>; notes?: string; isDraft: boolean }) =>
    request<{ data: unknown }>('/sales', { method: 'POST', body: JSON.stringify(payload) }, token),
  valuation: (token: string) => request<{ data: unknown }>('/inventory/products/valuation', {}, token),
  lowStock: (token: string) => request<{ data: unknown[]; count: number }>('/inventory/products/low-stock', {}, token),
  purchases: (token: string) => request<{ data: unknown[]; total: number }>('/inventory/purchases?page=1&limit=20', {}, token),
  createPurchase: (token: string, payload: { supplierName?: string; notes?: string; items: Array<{ productId: string; quantity: number; unitCost: number }> }) =>
    request<{ data: unknown }>('/inventory/purchases', { method: 'POST', body: JSON.stringify(payload) }, token),
  customers: (token: string) => request<{ data: unknown[]; total: number }>('/customers?page=1&limit=20', {}, token),
  segmentation: (token: string) => request<{ data: unknown }>('/customers/segmentation', {}, token),
  subscription: (token: string) => request<{ data: unknown }>('/subscriptions/current', {}, token),
  changePlan: (token: string, payload: { planType: 'FREE' | 'STARTER' | 'BUSINESS'; paymentToken?: string }) =>
    request<{ message: string }>('/subscriptions/plan', { method: 'PATCH', body: JSON.stringify(payload) }, token),
  payments: (token: string) => request<{ data: unknown[]; total: number }>('/subscriptions/payments?page=1&limit=10', {}, token),
  seedDemo: (token: string) => request<{ data: { message: string; created: unknown } }>('/onboarding/demo', { method: 'POST' }, token),
  checklist: (token: string) => request<{ data: unknown }>('/onboarding/checklist', {}, token),
  users: (token: string) => request<{ data: unknown[]; total: number }>('/users?page=1&limit=20', {}, token),
  auditLog: (token: string) => request<{ data: unknown[]; total: number }>('/users/audit-log?page=1&limit=10', {}, token),
  inviteUser: (token: string, payload: { email: string; role: 'ADMIN' | 'SELLER' | 'WAREHOUSE' }) =>
    request<{ message: string }>('/users/invite', { method: 'POST', body: JSON.stringify(payload) }, token),
  notifications: (token: string) => request<{ data: unknown[]; total: number; unreadCount: number }>('/notifications?page=1&limit=20', {}, token),
  markAllNotificationsRead: (token: string) => request<{ message: string }>('/notifications/read-all', { method: 'PATCH' }, token),
  notificationPreferences: (token: string) => request<{ data: unknown[] }>('/notifications/preferences', {}, token),
};