import { apiClient } from './client';
import type {
  ReportAggregation,
  AggregationSourceBatch,
  CicReportVersion,
  CicReportEvent,
  ReportArtifact,
  ValidationResult,
  ReportDelivery,
  ReportDeliveryConfig,
} from '@/types';

export const reportingApi = {
  // Aggregations
  getAggregations: (params?: { reportCode?: string; dataPeriodCode?: string }) =>
    apiClient.get<any, ReportAggregation[]>('/report-aggregations', { params }),

  getAggregationById: (id: string) =>
    apiClient.get<any, ReportAggregation>(`/report-aggregations/${id}`),

  createManualAggregation: (data: {
    reportCode: string;
    dataPeriodCode: string;
    batchIds: string[];
  }) => apiClient.post<any, ReportAggregation>('/report-aggregations', data),

  createAutomaticAggregation: (data: {
    reportCode: string;
    dataPeriodCode: string;
  }) => apiClient.post<any, ReportAggregation>('/report-aggregations/auto', data),

  startAggregation: (id: string) =>
    apiClient.post<any, ReportAggregation>(`/report-aggregations/${id}/start`),

  completeAggregation: (id: string) =>
    apiClient.post<any, ReportAggregation>(`/report-aggregations/${id}/complete`),

  failAggregation: (id: string, message: string) =>
    apiClient.post<any, ReportAggregation>(`/report-aggregations/${id}/fail`, null, {
      params: { message },
    }),

  getAggregationSources: (id: string) =>
    apiClient.get<any, AggregationSourceBatch[]>(`/report-aggregations/${id}/sources`),

  // Validations & Checks
  getValidationResults: (aggregationId: string) =>
    apiClient.get<any, ValidationResult[]>('/validation-results', {
      params: { aggregationId },
    }),

  exportValidationResultsCsv: (aggregationId: string) =>
    apiClient.get(`/validation-results/export`, {
      params: { aggregationId },
      responseType: 'blob',
    }),

  evaluateReportChecks: (data: {
    aggregationId: string;
    reportCode: string;
    values: Record<string, number>;
  }) => apiClient.post<any, number>('/report-checks/evaluate', data),

  // CIC Report Versions
  getCicReportVersions: (params?: { reportCode?: string; dataPeriodCode?: string }) =>
    apiClient.get<any, CicReportVersion[]>('/cic-report-versions', { params }),

  getCicReportVersionById: (id: string) =>
    apiClient.get<any, CicReportVersion>(`/cic-report-versions/${id}`),

  getVersionEvents: (versionId: string) =>
    apiClient.get<any, CicReportEvent[]>(`/cic-report-versions/${versionId}/events`),

  createCicReportVersion: (data: {
    reportCode: string;
    dataPeriodCode: string;
    aggregationId: string;
  }) => apiClient.post<any, CicReportVersion>('/cic-report-versions', data),

  approveCicReportVersion: (id: string) =>
    apiClient.post<any, CicReportVersion>(`/cic-report-versions/${id}/approve`),

  rejectCicReportVersion: (id: string, reason: string) =>
    apiClient.post<any, CicReportVersion>(`/cic-report-versions/${id}/reject`, { reason }),

  adjustReportVersion: (versionId: string, formData: FormData) =>
    apiClient.post<any, CicReportVersion>(`/cic-report-versions/${versionId}/adjust`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  toggleVersionActive: (versionId: string) =>
    apiClient.patch<any, CicReportVersion>(`/cic-report-versions/${versionId}/toggle-active`),

  // Report Artifacts
  getArtifactsByVersionId: (reportVersionId: string) =>
    apiClient.get<any, ReportArtifact[]>('/report-artifacts', {
      params: { reportVersionId },
    }),

  generateArtifacts: (data: {
    reportCode: string;
    aggregationId: string;
    reportingUnitCode: string;
    reportingDate: string;
    reporterName: string;
    reporterPhone: string;
    reporterEmail: string;
    sequence: number;
    reportVersionId: string;
  }) => apiClient.post<any, any>('/report-artifacts', data),

  downloadArtifact: (fileId: number) =>
    apiClient.get(`/report-artifacts/${fileId}/download`, {
      responseType: 'blob',
    }),

  // Report Deliveries & External Transmission
  getReportDeliveries: () =>
    apiClient.get<any, ReportDelivery[]>('/report-deliveries'),

  dispatchReportDelivery: (data: { reportVersionId: string; destination?: string }) =>
    apiClient.post<any, ReportDelivery>('/report-deliveries/dispatch', data),

  retryReportDelivery: (id: string) =>
    apiClient.post<any, ReportDelivery>(`/report-deliveries/${id}/retry`),

  // Report Delivery Configurations (CIC, SVB, PCB)
  getDeliveryConfigs: () =>
    apiClient.get<any, ReportDeliveryConfig[]>('/report-delivery-configs'),

  getDeliveryConfig: (destination: string) =>
    apiClient.get<any, ReportDeliveryConfig>(`/report-delivery-configs/${destination}`),

  updateDeliveryConfig: (destination: string, data: Partial<ReportDeliveryConfig>) =>
    apiClient.put<any, ReportDeliveryConfig>(`/report-delivery-configs/${destination}`, data),
};
