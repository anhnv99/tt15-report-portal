import axios from 'axios';
import { message } from 'antd';
import type { ApiResponse } from '@/types';

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
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
