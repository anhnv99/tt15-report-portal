import type { ReportDestinationProfile } from './types';

export const CIC_DESTINATION_PROFILE: ReportDestinationProfile = {
  id: 'CIC',
  label: 'CIC',
  deliveryLabel: 'Cổng CIC (H2H)',
  tagColor: 'blue',
  defaultArtifactExtension: 'json',
  artifactDescription: 'Gói JSON/ZIP theo chuẩn CIC',
  supportsJsonSchema: true,
  supportsExcelMapping: false,
  supportsWorkbookAdjustment: false,
  defaultReportCode: 'D10',
  getDefaultRootStructure: (reportCode) => JSON.stringify({
    MA_DON_VI: '79301001',
    MA_BIEU_MAU: reportCode || 'D10',
    DANH_SACH_DU_LIEU: [],
  }, null, 2),
};
