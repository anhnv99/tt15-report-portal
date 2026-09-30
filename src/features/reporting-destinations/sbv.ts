import type { ReportDestinationProfile } from './types';

export const SBV_DESTINATION_PROFILE: ReportDestinationProfile = {
  id: 'SBV',
  label: 'SBV',
  deliveryLabel: 'Cổng SBV (NHNN)',
  tagColor: 'green',
  defaultArtifactExtension: 'xlsx',
  artifactDescription: 'Biểu mẫu Excel chuẩn NHNN',
  supportsJsonSchema: false,
  supportsExcelMapping: true,
  supportsWorkbookAdjustment: true,
  defaultReportCode: 'B01',
  getDefaultRootStructure: (reportCode) => JSON.stringify({
    sheets: [{ prefix: 'CD', sheetName: `${reportCode || 'B01'}_CanDoi` }],
  }, null, 2),
};
