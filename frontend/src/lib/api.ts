import axios from 'axios';

// A list response (e.g. /api/reservations, ~1800 rows × ~40 keys each,
// nested guest/room/companions objects) re-runs these conversions on every
// one of those keys, but the actual set of distinct key names repeats across
// every row — caching the conversion turns ~75k regex calls per response
// into a handful, one per distinct key ever seen.
const camelCache = new Map<string, string>();
const snakeCache = new Map<string, string>();

const toCamelCase = (str: string) => {
  const cached = camelCache.get(str);
  if (cached !== undefined) return cached;
  const result = str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
  camelCache.set(str, result);
  return result;
};
const toSnakeCase = (str: string) => {
  const cached = snakeCache.get(str);
  if (cached !== undefined) return cached;
  const result = str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  snakeCache.set(str, result);
  return result;
};

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

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname) {
    return `http://${window.location.hostname}:8000`;
  }
  return 'http://localhost:8000';
}

export const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  // Without this, a hung request never rejects, so the store's Promise.all
  // hydration never resolves and `hydrating` stays true forever — the app
  // just looks permanently loading with no error surfaced.
  timeout: 20_000,
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
  if (!process.env.NEXT_PUBLIC_API_URL && typeof window !== 'undefined' && window.location.hostname) {
    config.baseURL = `http://${window.location.hostname}:8000`;
  }
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
