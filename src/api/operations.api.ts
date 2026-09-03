import { apiClient } from './client';
import type { OperationsDashboard, WorkflowDefinition } from '@/types';

export const operationsApi = {
  getDashboardMetrics: () =>
    apiClient.get<any, OperationsDashboard>('/operations/dashboard'),
};

export const workflowApi = {
  getWorkflows: () =>
    apiClient.get<any, WorkflowDefinition[]>('/workflow-definitions'),
};
