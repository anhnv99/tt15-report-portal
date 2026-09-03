import { apiClient } from './client';
import type { WorkflowDefinition } from '@/types';

export const workflowApi = {
  getWorkflows: () =>
    apiClient.get<any, WorkflowDefinition[]>('/workflows'),

  registerWorkflow: (data: WorkflowDefinition) =>
    apiClient.post<any, WorkflowDefinition>('/workflows', data),
};
