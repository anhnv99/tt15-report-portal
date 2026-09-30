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
  getAggregations: (params?: { reportCode?: string; dataPeriodId?: number }) =>
    apiClient.get<any, ReportAggregation[]>('/report-aggregations', { params }),

  getAggregationById: (id: string) =>
    apiClient.get<any, ReportAggregation>(`/report-aggregations/${id}`),

  createManualAggregation: (data: {
    reportCode: string;
    dataPeriodId: number;
    fromDate: string;
    toDate: string;
    sourceBatchIds: string[];
  }) => apiClient.post<any, ReportAggregation>('/report-aggregations', data),

  createAutomaticAggregation: (data: {
    reportCode: string;
    dataPeriodId: number;
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
  getCicReportVersions: (params?: { reportCode?: string; dataPeriodId?: number }) =>
    apiClient.get<any, CicReportVersion[]>('/cic-report-versions', { params }),

  getCicReportVersionById: (id: string) =>
    apiClient.get<any, CicReportVersion>(`/cic-report-versions/${id}`),

  getVersionEvents: (versionId: string) =>
    apiClient.get<any, CicReportEvent[]>(`/cic-report-versions/${versionId}/events`),

  createCicReportVersion: (data: {
    reportCode: string;
    dataPeriodId: number;
    aggregationId: string;
    versionNumber: number;
    reportingDate: string;
  }) => apiClient.post<any, CicReportVersion>('/cic-report-versions', data),

  approveCicReportVersion: (id: string) =>
    apiClient.post<any, CicReportVersion>(`/cic-report-versions/${id}/approve`),

  approveVersion: (id: string) =>
    apiClient.post<any, CicReportVersion>(`/cic-report-versions/${id}/approve`),

  rejectCicReportVersion: (id: string, reason: string) =>
    apiClient.post<any, CicReportVersion>(`/cic-report-versions/${id}/reject`, { reason }),

  rejectVersion: (id: string, reason: string) =>
    apiClient.post<any, CicReportVersion>(`/cic-report-versions/${id}/reject`, { reason }),

  adjustReportVersion: (versionId: string, formData: FormData) =>
    apiClient.post<any, CicReportVersion>(`/cic-report-versions/${versionId}/adjust`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  previewReportCalculation: (data: {
    values: Record<string, Record<string, number>>;
    formulas: Array<{ lineCode: string; columnCode: string; expression: string }>;
  }) => apiClient.post<any, Record<string, Record<string, number>>>('/report-calculations/preview', data),

  getReportCalculationFormulas: (reportCode: string, sheetCode: string) =>
    apiClient.get<any, Array<{ lineCode: string; columnCode: string; expression: string }>>(
      '/report-calculations/formulas', { params: { reportCode, sheetCode } }
    ),

  saveReportCalculationFormula: (data: { reportCode: string; sheetCode: string; lineCode: string; columnCode: string; expression: string }) =>
    apiClient.put<any, { lineCode: string; columnCode: string; expression: string }>('/report-calculations/formulas', data),

  previewFormulaSuggestions: (data: {
    mappings: Array<{ lineCode: string; columnCode: string; workbookSheet: string; excelRow: number; excelColumn: number }>;
    formulaSuggestions: Array<{ lineCode: string; columnCode: string; sheetCode: string; excelFormula: string }>;
  }) => apiClient.post<any, Array<{
    lineCode: string; columnCode: string; excelFormula: string; expression: string | null;
    status: 'TRANSLATABLE' | 'REVIEW_REQUIRED'; reason: string | null;
  }>>('/report-calculations/formula-suggestions/preview', data),

  saveReportCalculationFormulas: (formulas: Array<{ reportCode: string; sheetCode: string; lineCode: string; columnCode: string; expression: string }>) =>
    apiClient.put<any, Array<{ lineCode: string; columnCode: string; expression: string }>>('/report-calculations/formulas/batch', { formulas }),

  getReportCellMappings: (reportCode: string, sheetCode?: string) =>
    apiClient.get<any, Array<{ reportCode: string; sheetCode: string; lineCode: string; columnCode: string; workbookSheet: string; excelRow: number; excelColumn: number }>>(
      '/report-cell-mappings', { params: { reportCode, ...(sheetCode ? { sheetCode } : {}) } }
    ),

  saveReportCellMapping: (data: { reportCode: string; sheetCode: string; lineCode: string; columnCode: string; workbookSheet: string; excelRow: number; excelColumn: number }) =>
    apiClient.put<any, any>('/report-cell-mappings', data),

  saveReportCellMappings: (mappings: Array<{ reportCode: string; sheetCode: string; lineCode: string; columnCode: string; workbookSheet: string; excelRow: number; excelColumn: number }>) =>
    apiClient.put<any, any[]>('/report-cell-mappings/batch', { mappings }),

  saveReportAdjustment: (data: {
    sourceVersionId: string; sheetCode: string; reason: string; adjustedBy: string;
    values: Record<string, Record<string, number>>;
  }) => apiClient.post<any, { versionId: string; versionNumber: number }>('/report-adjustments', data),

  getReportAdjustmentAudit: (versionId: string) =>
    apiClient.get<any, import('@/types').ReportAdjustmentAudit[]>(`/report-adjustments/${versionId}/audit`),

  getReportVersionFormulaSnapshot: (versionId: string) =>
    apiClient.get<any, import('@/types').ReportVersionFormula[]>(`/report-adjustments/${versionId}/formulas`),

  getReportVersionCells: (versionId: string, sheetCode: string) =>
    apiClient.get<any, Record<string, Record<string, number>>>(`/report-version-cells/${versionId}`, { params: { sheetCode } }),

  importReportVersionCells: (versionId: string, data: {
    sheetCode: string; values: Record<string, Record<string, number>>;
  }) => apiClient.put<any, void>(`/report-version-cells/${versionId}`, data),

  exportAdjustedSbvReport: (versionId: string) =>
    apiClient.post<any, { fileName: string; sha256: string; size: number }>(`/report-adjustments/${versionId}/export`),

  getAdjustedSbvExportReadiness: (versionId: string) =>
    apiClient.get<any, {
      ready: boolean; mappingCount: number; snapshotCellCount: number;
      missingMappedValues: Array<{ sheetCode: string; lineCode: string; columnCode: string }>;
      unmappedSnapshotCells: Array<{ sheetCode: string; lineCode: string; columnCode: string }>;
    }>(`/report-adjustments/${versionId}/export-readiness`),

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

  // System Profile from application.yml
  getSystemProfile: () =>
    apiClient.get<any, { reportingUnitCode: string; reporterName: string; reporterPhone: string; reporterEmail: string }>(
      '/report-delivery-configs/profile'
    ),
};
