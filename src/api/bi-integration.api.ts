import { apiClient } from './client';

export interface CtlBiEtlStatusDto {
  id: number;
  kdlId: number;
  reportCode: string;
  status: 'READY' | 'RUNNING' | 'BATCH_CREATED' | 'FAILED' | string;
  totalRecords: number;
  etlStartTime?: string;
  etlEndTime?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const biIntegrationApi = {
  getStatuses: async (kdlId?: number): Promise<CtlBiEtlStatusDto[]> => {
    const res = await apiClient.get<any, CtlBiEtlStatusDto[]>('/integrations/bi/statuses', {
      params: { kdlId },
    });
    return Array.isArray(res) ? res : [];
  },

  syncNow: async (kdlId: number, reportCode: string = 'D10', autoApprove: boolean = false): Promise<any> => {
    return apiClient.post<any, any>('/integrations/bi/sync-now', null, {
      params: { kdlId, reportCode, autoApprove },
    });
  },

  seedG04964: async (kdlId: number): Promise<{ rowCount: number; sheetCount: number }> =>
    apiClient.post<any, { rowCount: number; sheetCount: number }>('/integrations/bi/seed-g04964', null, { params: { kdlId } }),

  notifyReady: async (payload: {
    kdlId: number;
    reportCode: string;
    totalRecords?: number;
    note?: string;
  }): Promise<any> => {
    return apiClient.post<any, any>('/integrations/bi/notify-etl-ready', payload);
  },
};
