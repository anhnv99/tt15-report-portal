// API Envelopes
export interface ApiResponse<T> {
  success: boolean;
  code: string;
  message?: string;
  result: T;
}

export interface PagedResult<T> {
  totalCount: number;
  items: T[];
}

// Master Data & Catalog
export interface DataPeriod {
  id: number;
  code: string;
  name: string;
  periodType: string;
  startDate: string;
  endDate: string;
  reportingDeadline?: string;
  active: boolean;
  closed: boolean;
  createdAt?: string;
}

export interface DataPeriodType {
  id: number;
  code: string;
  name: string;
  description?: string;
  reportingDay?: number;
  autoAggregationDay?: number;
  reportingDayDisplay?: string;
  autoAggregationDayDisplay?: string;
  applicableTemplates?: string;
  dayType?: string;
  periodUnit?: string;
  intervalValue?: number;
}

export interface DanhMucCode {
  id?: number;
  listCode?: string;
  code: string;
  name: string;
  description?: string;
  active?: boolean;
  sortOrder?: number;
}

export interface ReportTemplate {
  id?: number;
  reportCode: string;
  templateNumber?: string;
  reportName: string;
  frequency?: string;
  filePrefix?: string;
  rootStructure?: string;
  sourceReference?: string;
  description?: string;
  circularCode?: string;
  periodTypeCode?: string;
  dataPeriodTypeId?: number;
  active?: boolean;
  isActive?: boolean;
  version?: number;
  targetDestination?: 'CIC' | 'SBV' | 'PCB' | string;
}

export interface ReportTemplateField {
  id: number;
  indicatorCode: string;
  jsonPath: string;
  dataType: string;
  maxLength?: number;
  mandatory: boolean;
  sourceReference?: string;
}

export interface ReportTemplateRule {
  id: number;
  actualKey: string;
  expectedKey: string;
  operator: 'EQ' | 'NE' | 'GT' | 'GTE' | 'LT' | 'LTE';
  tolerance?: number;
  message: string;
}

// Import Batches
export type ImportBatchStatus =
  | 'RECEIVED'
  | 'UPLOADED'
  | 'STAGED'
  | 'PROCESSING'
  | 'FAILED'
  | 'PROCESSED'
  | 'APPROVED'
  | 'REJECTED';

export interface ImportBatch {
  id: string;
  batchCode?: string;
  fileName?: string;
  importType: string;
  dataPeriodId: number;
  dataPeriodCode?: string;
  originalFileName: string;
  fileSize: number;
  sourceChannel?: 'MANUAL' | 'ETL' | string;
  status: ImportBatchStatus;
  totalRows: number;
  validRows: number;
  errorRows: number;
  rejectionReason?: string;
  uploadedBy?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ImportApprovalEvent {
  id: string;
  batchCode?: string;
  batchId?: string;
  eventType: string;
  actor: string;
  reason?: string;
  occurredAt: string;
}

export interface StagingRow {
  rowNumber: number;
  payloadJson: string | Record<string, any>;
  errorJson?: string;
  status: string;
}

// Reporting & Aggregation
export type AggregationStatus = 'CREATED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface ReportAggregation {
  id: string;
  reportCode: string;
  dataPeriodCode: string;
  status: AggregationStatus;
  totalRecords: number;
  sourceBatchCount: number;
  failedReason?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface AggregationSourceBatch {
  batchId: string;
  fileName: string;
  importType: string;
  status: ImportBatchStatus;
  totalRows: number;
  stagedRowsCount: number;
}

export type CicReportStatus = 'DRAFT' | 'APPROVED' | 'SUBMITTED' | 'REJECTED';

export interface CicReportVersion {
  id: string;
  reportCode: string;
  dataPeriodCode: string;
  versionNumber: number;
  status: CicReportStatus;
  aggregationId: string;
  totalRecords: number;
  approvedBy?: string;
  approvedAt?: string;
  fileName?: string;
  reportingDate?: string;
  submittedBy?: string;
  submittedAt?: string;
  createdAt: string;
  isActive?: boolean;
}

export interface CicReportEvent {
  id: string;
  versionCode?: string;
  eventType?: string;
  action?: string;
  actor?: string;
  actorRef?: string;
  reason?: string;
  content?: string;
  occurredAt: string;
}

export interface ReportArtifact {
  id: number;
  reportVersionId: string;
  artifactType?: 'JSON' | 'ZIP' | 'XLSX';
  fileType?: string;
  fileName: string;
  fileSize: number;
  sha256Hash?: string;
  checksumSha256?: string;
  downloadUrl?: string;
  createdAt?: string;
}

export interface ValidationResult {
  id: string;
  aggregationId: string;
  ruleId?: number;
  ruleCode?: string;
  severity: 'INFO' | 'WARNING' | 'ERROR';
  fieldCode?: string;
  message: string;
  actualValue?: string;
  expectedValue?: string;
  rowNumber?: number;
  createdAt?: string;
}

export type ReportDeliveryStatus = 'PENDING' | 'SENDING' | 'ACCEPTED' | 'DELIVERED' | 'FAILED';

export interface ReportDelivery {
  id: string;
  reportVersionId: string;
  destination?: string;
  correlationId?: string;
  status: ReportDeliveryStatus;
  externalId?: string;
  attemptCount?: number;
  retryCount?: number;
  httpStatus?: number;
  message?: string;
  errorMessage?: string;
  receiptReference?: string;
  channel?: string;
  lastAttemptAt?: string;
  dispatchedAt?: string;
  acceptedAt?: string;
  deliveredAt?: string;
}

export interface ReportDeliveryConfig {
  id?: number;
  destination: string;
  name: string;
  webhookUrl: string;
  authToken?: string;
  callbackUrl?: string;
  callbackToken?: string;
  isEnabled: boolean;
  isMock: boolean;
  timeoutMs: number;
  description?: string;
  updatedAt?: string;
}

// Operations Dashboard
export interface OperationsDashboard {
  totalTemplates: number;
  activeDataPeriods: number;
  pendingImportBatches: number;
  runningAggregations: number;
  draftReportVersions: number;
  recentValidationErrors: number;
}

// Workflow
export interface TaskDefinition {
  code: string;
  name: string;
  taskType: number;
  stepOrder: number;
}

export interface ProcessDefinition {
  code: string;
  name: string;
  version: number;
  tasks: TaskDefinition[];
}

export interface WorkflowDefinition {
  code: string;
  name: string;
  description?: string;
  processes: ProcessDefinition[];
}
