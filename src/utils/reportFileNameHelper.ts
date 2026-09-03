/**
 * Tiện ích tự động sinh Tên Tệp Báo Cáo Chuẩn theo Thông tư 15 & Quyết định 573/QĐ-NHNN
 * Cấu trúc chuẩn: [MÃ_BÁO_CÁO][MÃ_ĐƠN_VỊ][YYYYMMDD].[STT_3_CHỮ_SỐ]
 * Ví dụ: D107930100120260831.001 (hoặc .json / .zip)
 */
export const getStandardReportFileName = (
  reportCode?: string,
  reportingDate?: string,
  versionNumber?: number,
  reportingUnitCode: string = '79301001',
  extension?: string
): string => {
  const code = (reportCode || 'D10').toUpperCase().trim();
  const dateDigits = (reportingDate || '20260831').replace(/[^0-9]/g, '');
  const seq = String(versionNumber || 1).padStart(3, '0');
  const base = `${code}${reportingUnitCode}${dateDigits}.${seq}`;
  return extension ? `${base}.${extension.replace(/^\./, '')}` : base;
};
