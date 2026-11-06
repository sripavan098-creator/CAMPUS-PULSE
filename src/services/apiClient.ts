import { API_CONFIG } from '../config/apiConfig';
import { tokenStorage } from './tokenStorage';

export class ApiError extends Error {
  status: number;
  data: any;
  isNetworkError: boolean;
  isAuthError: boolean;

  constructor(message: string, status = 0, data: any = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.isNetworkError = status === 0;
    this.isAuthError = status === 401;
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  requiresAuth?: boolean;
}

/**
 * Pull a human-readable message out of a failed response body. The backend
 * wraps errors as `{ error: { code, message } }`, but plain `{ message }` and
 * `{ detail }` shapes are handled too so an error object never leaks into the
 * UI as "[object Object]".
 */
export function extractErrorMessage(data: any, status: number): string {
  if (data && typeof data === 'object') {
    const { error, message, detail } = data;
    if (typeof error === 'string' && error) return error;
    if (error && typeof error === 'object' && typeof error.message === 'string' && error.message) {
      return error.message;
    }
    if (typeof message === 'string' && message) return message;
    if (typeof detail === 'string' && detail) return detail;
  }
  return `Request failed with status ${status}`;
}

export const apiClient = {
  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const {
      timeoutMs = API_CONFIG.timeoutMs,
      requiresAuth = true,
      headers: customHeaders = {},
      ...fetchOptions
    } = options;

    const url = API_CONFIG.endpoint(endpoint);

    // Prepare headers
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(customHeaders as Record<string, string>),
    };

    // Attach Bearer token if requested or available
    if (requiresAuth) {
      const token = await tokenStorage.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    // AbortController for network timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response body
      const contentType = response.headers.get('content-type') || '';
      let data: any = null;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }

      // A 401 while we held a token means the session died, so drop it and
      // broadcast. A 401 with no token is just a failed login, and its real
      // message (e.g. "Email or password is incorrect.") must reach the user.
      if (response.status === 401) {
        const hadToken = requiresAuth && Boolean(await tokenStorage.getToken());
        if (hadToken) {
          await tokenStorage.clearAll();
          window.dispatchEvent(new CustomEvent('campus_pulse_session_expired'));
          throw new ApiError('Session expired. Please log in again.', 401, data);
        }
        throw new ApiError(extractErrorMessage(data, 401), 401, data);
      }

      if (!response.ok) {
        throw new ApiError(extractErrorMessage(data, response.status), response.status, data);
      }

      return data as T;
    } catch (err: any) {
      clearTimeout(timeoutId);

      if (err instanceof ApiError) {
        throw err;
      }

      if (err.name === 'AbortError') {
        throw new ApiError('Network request timed out. Please check your internet connection.', 0);
      }

      throw new ApiError(
        err.message || 'Unable to connect to the server. Please check your network.',
        0,
        err
      );
    }
  },

  get<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T = any>(endpoint: string, body?: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put<T = any>(endpoint: string, body?: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  },

  // Health check helper to verify live connection
  async checkHealth(): Promise<{ ok: boolean; status: number; message: string; raw?: any }> {
    try {
      const data = await this.get('/api/health', { requiresAuth: false, timeoutMs: 8000 });
      return { ok: true, status: 200, message: 'Backend healthy', raw: data };
    } catch (err: any) {
      return {
        ok: false,
        status: err.status || 0,
        message: err.message || 'Health check failed',
        raw: err.data
      };
    }
  }
};
