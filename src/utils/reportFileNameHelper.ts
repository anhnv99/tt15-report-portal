import { generateFileNamePreview } from './namingRuleUtil';

/**
 * Tiện ích tự động sinh Tên Tệp Báo Cáo Chuẩn theo Thông tư 15 & Quyết định 573/QĐ-NHNN
 * Cấu trúc chuẩn: [MÃ_BÁO_CÁO][MÃ_ĐƠN_VỊ][YYYYMMDD].[STT_3_CHỮ_SỐ]
 * Ví dụ: D107930100120260831.001 (hoặc .json / .zip)
 */
export const getStandardReportFileName = (
  reportCode?: string,
  reportingDate?: string,
  versionNumber?: number,
  reportingUnitCode: string = 'PTF',
  extension?: string
): string => {
  return generateFileNamePreview({
    reportCode,
    reportingDate,
    sequence: versionNumber || 1,
    unitCode: reportingUnitCode,
    customPattern: extension ? `{REPORT_CODE}{UNIT_CODE}{DATE}.{SEQUENCE}.${extension.replace(/^\./, '')}` : undefined,
  });
};

