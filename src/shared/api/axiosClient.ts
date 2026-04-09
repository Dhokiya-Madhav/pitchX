import axios from "axios";
import { getApiBaseUrl } from "@/shared/api/httpClient";
import { getToken } from "@/features/auth/lib/authStorage";

export const axiosClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { "Content-Type": "application/json" },
  maxBodyLength: 15 * 1024 * 1024,
  maxContentLength: 15 * 1024 * 1024,
});

axiosClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
