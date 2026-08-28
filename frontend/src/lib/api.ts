import axios from 'axios';

const toCamelCase = (str: string) => str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
const toSnakeCase = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

const deepMapKeys = (obj: any, mapFn: (key: string) => string): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => deepMapKeys(v, mapFn));
  } else if (obj !== null && typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      result[mapFn(key)] = deepMapKeys(obj[key], mapFn);
      return result;
    }, {} as Record<string, any>);
  }
  return obj;
};

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

const TOKEN_STORAGE_KEY = 'hotel_auth_token';

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
  } else {
    delete api.defaults.headers.common['Authorization'];
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

// Re-hydrate token on load
const initialToken = getStoredToken();
if (initialToken) {
  setAuthToken(initialToken);
}

api.interceptors.request.use((config) => {
  if (config.data && !(config.data instanceof FormData)) {
    config.data = deepMapKeys(config.data, toSnakeCase);
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = deepMapKeys(response.data, toCamelCase);
    }
    return response;
  },
  (error) => {
    if (error.response?.data) {
      error.response.data = deepMapKeys(error.response.data, toCamelCase);
    }
    // A 401 here means the bearer token is missing/expired/revoked — the
    // stored token is now useless, so drop it and bounce to login instead of
    // leaving every page silently rendering empty lists.
    if (error.response?.status === 401 && typeof window !== "undefined") {
      setAuthToken(null);
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
