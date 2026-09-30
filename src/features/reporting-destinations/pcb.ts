import type { ReportDestinationProfile } from './types';

export const PCB_DESTINATION_PROFILE: ReportDestinationProfile = {
  id: 'PCB',
  label: 'PCB',
  deliveryLabel: 'Cổng PCB',
  tagColor: 'purple',
  defaultArtifactExtension: 'zip',
  artifactDescription: 'Gói dữ liệu PCB',
  supportsJsonSchema: false,
  supportsExcelMapping: false,
  supportsWorkbookAdjustment: false,
  defaultReportCode: 'PCB_01',
  getDefaultRootStructure: (reportCode) => JSON.stringify({
    MA_DON_VI: '79301001',
    MA_BIEU_MAU: reportCode || 'PCB_01',
    DU_LIEU_PCB: [],
  }, null, 2),
};
