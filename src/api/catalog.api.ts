import { apiClient } from './client';
import type {
  DataPeriod,
  DataPeriodType,
  DanhMucCode,
  ReportTemplate,
  ReportTemplateField,
  ReportTemplateRule,
} from '@/types';

export const catalogApi = {
  // Data Periods
  getDataPeriods: () =>
    apiClient.get<any, DataPeriod[]>('/catalog/data-periods/options'),

  getDataPeriodByCode: (code: string) =>
    apiClient.get<any, DataPeriod>(`/catalog/data-periods/${code}`),

  createDataPeriod: (data: {
    code: string;
    name: string;
    periodType: string;
    startDate: string;
    endDate: string;
    reportingDeadline?: string;
  }) => apiClient.post<any, DataPeriod>('/catalog/data-periods', data),

  closeDataPeriod: (code: string) =>
    apiClient.patch<any, DataPeriod>(`/catalog/data-periods/${code}/close`),

  openDataPeriod: (code: string) =>
    apiClient.patch<any, DataPeriod>(`/catalog/data-periods/${code}/open`),

  generatePeriodsForTemplate: (data: {
    reportCode: string;
    startDate: string;
    endDate: string;
  }) =>
    apiClient.post<any, DataPeriod[]>(
      '/catalog/data-periods/template-generate',
      data
    ),

  // Data Period Types
  getDataPeriodTypes: () =>
    apiClient.get<any, DataPeriodType[]>('/catalog/data-periods/types'),

  // Danh Muc Codes
  getDanhMucCodes: (listCode: string) =>
    apiClient.get<any, DanhMucCode[]>(`/catalog/code-lists/${listCode}`),

  createDanhMucCode: (data: {
    listCode: string;
    code: string;
    name: string;
    description?: string;
  }) => apiClient.post<any, DanhMucCode>('/catalog/code-lists', data),

  // Report Templates
  getReportTemplates: () =>
    apiClient.get<any, ReportTemplate[]>('/report-templates'),

  getReportTemplateByCode: (reportCode: string) =>
    apiClient.get<any, ReportTemplate>(`/report-templates/${reportCode}`),

  createReportTemplate: (data: Partial<ReportTemplate>) =>
    apiClient.post<any, ReportTemplate>('/report-templates', data),

  updateReportTemplate: (reportCode: string, data: Partial<ReportTemplate>) =>
    apiClient.put<any, ReportTemplate>(`/report-templates/${reportCode}`, data),

  deleteReportTemplate: (reportCode: string) =>
    apiClient.delete(`/report-templates/${reportCode}`),

  toggleTemplateActive: (reportCode: string) =>
    apiClient.patch<any, ReportTemplate>(`/report-templates/${reportCode}/toggle-active`),

  // Template Fields
  getTemplateFields: (reportCode: string) =>
    apiClient.get<any, ReportTemplateField[]>(`/report-templates/${reportCode}/fields`),

  addTemplateField: (reportCode: string, field: Partial<ReportTemplateField>) =>
    apiClient.post<any, ReportTemplateField>(`/report-templates/${reportCode}/fields`, field),

  deleteTemplateField: (reportCode: string, fieldId: number) =>
    apiClient.delete(`/report-templates/${reportCode}/fields/${fieldId}`),

  // Template Rules
  getTemplateRules: (reportCode: string) =>
    apiClient.get<any, ReportTemplateRule[]>(`/report-templates/${reportCode}/rules`),

  addTemplateRule: (reportCode: string, rule: Partial<ReportTemplateRule>) =>
    apiClient.post<any, ReportTemplateRule>(`/report-templates/${reportCode}/rules`, rule),

  updateTemplateRule: (reportCode: string, ruleId: number, rule: Partial<ReportTemplateRule>) =>
    apiClient.put<any, ReportTemplateRule>(`/report-templates/${reportCode}/rules/${ruleId}`, rule),

  deleteTemplateRule: (reportCode: string, ruleId: number) =>
    apiClient.delete(`/report-templates/${reportCode}/rules/${ruleId}`),
};
