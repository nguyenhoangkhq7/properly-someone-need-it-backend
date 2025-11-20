import axios from "axios";
import type { AxiosInstance, AxiosResponse } from "axios";

// Kiểu dữ liệu API trả về (có thể tùy chỉnh theo backend)
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// Base URL môi trường
const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_URL ??
  process.env.API_URL ??
  "http://localhost:3000";

// Tạo instance axios
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Hàm xử lý lỗi (dùng chung)
function handleError(error: any): never {
  if (axios.isAxiosError(error)) {
    const message =
      error.response?.data?.message || error.message || "Unknown Axios error";

    console.error("API Error:", message);
    throw new Error(message);
  }

  // fallback
  throw new Error("Unknown error occurred");
}

// ---- Wrapper chuẩn, an toàn cho strict mode ----
export const apiClient = {
  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await api.get(url, {
        params,
      });
      return response.data.data;
    } catch (error) {
      handleError(error);
    }
  },

  async post<T>(url: string, body?: unknown): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await api.post(url, body);
      return response.data.data;
    } catch (error) {
      handleError(error);
    }
  },

  async put<T>(url: string, body?: unknown): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await api.put(url, body);
      return response.data.data;
    } catch (error) {
      handleError(error);
    }
  },

  async delete<T>(url: string): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await api.delete(url);
      return response.data.data;
    } catch (error) {
      handleError(error);
    }
  },
};

export default apiClient;
