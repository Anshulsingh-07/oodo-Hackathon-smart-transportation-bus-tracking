import axios, { AxiosError, AxiosRequestConfig } from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

let accessToken = "";
let refreshPromise: Promise<string> | null = null;

export const setAccessToken = (token: string): void => {
  accessToken = token;
};

const refreshAccessToken = async (): Promise<string> => {
  const response = await axios.post(
    `${baseURL}/auth/refresh`,
    {},
    { withCredentials: true },
  );
  const token = response.data.accessToken;
  accessToken = token;
  return token;
};

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers ?? ({} as any);
    (config.headers as any).Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status !== 401 || original?._retry) {
      throw error;
    }

    original._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;
    original.headers = original.headers ?? ({} as any);
    (original.headers as any).Authorization = `Bearer ${newToken}`;
    return api(original);
  },
);
