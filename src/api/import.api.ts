import { apiClient } from './client';
import type { ImportBatch, StagingRow, ImportApprovalEvent, PagedResult } from '@/types';

export const importApi = {
  getImportBatches: async (params?: {
    importType?: string;
    status?: string;
    dataPeriodId?: number;
    query?: string;
    page?: number;
    size?: number;
  }): Promise<ImportBatch[]> => {
    const res = await apiClient.get<any, PagedResult<ImportBatch> | ImportBatch[]>(
      '/import-batches',
      { params }
    );
    if (res && typeof res === 'object' && 'items' in res) {
      return res.items || [];
    }
    return Array.isArray(res) ? res : [];
  },

  getImportBatchById: (batchId: string) =>
    apiClient.get<any, ImportBatch>(`/import-batches/${batchId}`),

  uploadImportBatch: (formData: FormData) =>
    apiClient.post<any, ImportBatch>('/import-batches', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  getStagingRows: async (batchId: string): Promise<StagingRow[]> => {
    const res = await apiClient.get<any, StagingRow[]>(`/import-batches/${batchId}/rows`);
    return Array.isArray(res) ? res : [];
  },

  stageImportBatch: (batchId: string) =>
    apiClient.post<any, ImportBatch>(`/import-batches/${batchId}/stage`),

  runEtl: (batchId: string) =>
    apiClient.post<any, ImportBatch>(`/import-batches/${batchId}/etl`),

  approveImportBatch: (batchId: string) =>
    apiClient.post<any, ImportBatch>(`/import-batches/${batchId}/approve`),

  rejectImportBatch: (batchId: string, reason: string) =>
    apiClient.post<any, ImportBatch>(`/import-batches/${batchId}/reject`, null, {
      params: { reason },
    }),

  getBatchEvents: (batchId: string) =>
    apiClient.get<any, ImportApprovalEvent[]>(`/import-batches/${batchId}/events`),

  supplementImportBatch: (batchId: string, formData: FormData) =>
    apiClient.post<any, ImportBatch>(`/import-batches/${batchId}/supplement`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  getTempoTables: async (): Promise<{ tableName: string; rowCount: number }[]> => {
    const res = await apiClient.get<any, { tableName: string; rowCount: number }[]>('/tempo-data/tables');
    return Array.isArray(res) ? res : [];
  },

  previewTempoTable: async (params: { tableName: string; kdlId?: number; version?: number; limit?: number }): Promise<any[]> => {
    const res = await apiClient.get<any, any[]>('/tempo-data/preview', { params });
    return Array.isArray(res) ? res : [];
  },
};
