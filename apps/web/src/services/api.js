import axios from "axios";
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const api = axios.create({
    baseURL,
    withCredentials: true,
});
let accessToken = "";
let refreshPromise = null;
export const setAccessToken = (token) => {
    accessToken = token;
};
const refreshAccessToken = async () => {
    const response = await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
    const token = response.data.accessToken;
    accessToken = token;
    return token;
};
api.interceptors.request.use((config) => {
    if (accessToken) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});
api.interceptors.response.use((response) => response, async (error) => {
    const original = error.config;
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
    original.headers = original.headers ?? {};
    original.headers.Authorization = `Bearer ${newToken}`;
    return api(original);
});
