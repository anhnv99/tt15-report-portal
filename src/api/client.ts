import axios from 'axios';
import { message } from 'antd';
import type { ApiResponse } from '@/types';

const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('tt15_api_base_url');
    if (customUrl && customUrl.trim()) {
      return customUrl.trim();
    }
  }
  return import.meta.env.VITE_API_BASE_URL || '/api';
};

export const getActiveBaseURL = () => getBaseURL();
export const setCustomBaseURL = (url: string) => {
  if (!url || !url.trim()) {
    localStorage.removeItem('tt15_api_base_url');
  } else {
    localStorage.setItem('tt15_api_base_url', url.trim());
  }
};

export const apiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  config.baseURL = getBaseURL();
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    // If it's a binary blob download, return raw data
    if (response.config.responseType === 'blob') {
      return response.data;
    }
    const data = response.data as ApiResponse<any>;
    if (data && typeof data.success === 'boolean') {
      if (!data.success) {
        message.error(data.message || 'Thao tác không thành công');
        return Promise.reject(new Error(data.message || 'Error'));
      }
      return data.result !== undefined ? data.result : data;
    }
    return response.data;
  },
  (error) => {
    const errorMsg =
      error.response?.data?.message ||
      error.message ||
      'Có lỗi xảy ra khi gọi máy chủ';
    message.error(errorMsg);
    return Promise.reject(error);
  }
);
