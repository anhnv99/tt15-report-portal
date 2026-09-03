import * as XLSX from 'xlsx';
import { message } from 'antd';
import type { ReportTemplate, ReportTemplateField } from '@/types';
import { catalogApi } from '@/api/catalog.api';

export interface ReportSheetConfig {
  reportCode: string;
  reportName: string;
  sheetCount: number;
  sheets: {
    sheetName: string;
    description: string;
    sampleData: Record<string, any>[];
  }[];
}

export const getReportSheetConfig = (
  reportCode: string,
  template?: ReportTemplate | null,
  fields?: ReportTemplateField[]
): ReportSheetConfig => {
  return resolveReportSheetConfig(reportCode, template, fields);
};

/**
 * Phân giải cấu trúc Sheet nguồn theo quy định Thông tư 15 & QĐ 573:
 * 1. Ưu tiên cấu hình chuẩn nghiệp vụ cho các biểu mẫu chính (D31: 7 sheets, D10: 2 sheets)
 * 2. Đọc từ template.rootStructure / rootStructureJsonb nếu có khai báo
 * 3. Tự động suy luận theo danh mục chỉ tiêu & phân nhóm JSONPath
 */
export const resolveReportSheetConfig = (
  reportCode: string,
  template?: ReportTemplate | null,
  fields?: ReportTemplateField[]
): ReportSheetConfig => {
  const code = (reportCode || '').toUpperCase().trim();

  // 1. Biểu mẫu chuẩn D31: QĐ 573 Mẫu 04 (Quan hệ tín dụng 15 ngày)
  if (code === 'D31') {
    return getD31StandardConfig(fields, template?.reportName);
  }

  // 2. Biểu mẫu chuẩn D10: QĐ 573 Mẫu 01 (Thông tin khách hàng 3 ngày)
  if (code === 'D10') {
    return getD10StandardConfig(fields, template?.reportName);
  }

  // 3. Đọc từ rootStructure / rootStructureJsonb trong cơ sở dữ liệu nếu có khai báo sheets
  const rawStructure = (template as any)?.rootStructureJsonb || template?.rootStructure;
  if (rawStructure) {
    try {
      const parsed = typeof rawStructure === 'string' ? JSON.parse(rawStructure) : rawStructure;

      if (parsed?.sheets && Array.isArray(parsed.sheets) && parsed.sheets.length > 0) {
        return {
          reportCode: code,
          reportName: template?.reportName || `Biểu mẫu ${code}`,
          sheetCount: parsed.sheets.length,
          sheets: parsed.sheets.map((s: any) => ({
            sheetName: s.sheetName || s.name || 'Sheet1',
            description: s.description || '',
            sampleData: s.sampleData || [generateSampleRowForPrefix(s.prefix || '', fields || [])],
          })),
        };
      }
    } catch {
      // Bỏ qua lỗi cú pháp JSON và chuyển sang suy luận
    }
  }

  // 4. Tự động suy luận từ danh mục chỉ tiêu cho các biểu mẫu linh hoạt (D99, D11, D12...)
  if (fields && fields.length > 0) {
    const derived = deriveGenericSheetsFromFields(code, template?.reportName, fields);
    if (derived && derived.sheets.length > 0) {
      return derived;
    }
  }

  // 5. Fallback mặc định 1 sheet phẳng
  return {
    reportCode: code,
    reportName: template?.reportName || `Biểu mẫu ${code}`,
    sheetCount: 1,
    sheets: [
      {
        sheetName: `1_DuLieu_${code}`,
        description: `Bảng dữ liệu chuẩn cho biểu mẫu ${code}`,
        sampleData: [{ TTC01: '79301001', CIF: 'CIF88392019', TEN_KHACH_HANG: 'NGUYEN VAN A', DU_NO: 280000000, LOAI_TIEN: 'VND', NHOM_NO: '1' }],
      },
    ],
  };
};

/**
 * Cấu hình chuẩn QĐ 573 Mẫu 04 cho Báo Cáo D31
 * Gồm 7 phân hệ dữ liệu nguồn độc lập, tương thích 100% với D31ExcelImportRowParser
 */
const getD31StandardConfig = (fields?: ReportTemplateField[], reportName?: string): ReportSheetConfig => {
  return {
    reportCode: 'D31',
    reportName: reportName || 'Tập thông tin quan hệ tín dụng rút gọn (QĐ 573 Mẫu 04)',
    sheetCount: 7,
    sheets: [
      {
        sheetName: '1_KhachHang',
        description: 'Thông tin định danh Khách Hàng & Chi Nhánh (TTC01, TTC02, TTC03, TTC04)',
        sampleData: [
          {
            TTC01: '79301001',
            TTC02: 'CHI NHANH TP HO CHI MINH',
            TTC03: 'CIF88392019',
            TTC04: 'NGUYEN VAN A',
            CIF: 'CIF88392019',
            MA_LOAI_KH: 'CN',
            HO_TEN: 'NGUYEN VAN A',
            SO_CCCD_MST: '001085001234',
          },
          {
            TTC01: '79301001',
            TTC02: 'CHI NHANH TP HO CHI MINH',
            TTC03: 'CIF99281722',
            TTC04: 'CONG TY TNHH MAI LINH',
            CIF: 'CIF99281722',
            MA_LOAI_KH: 'DN',
            HO_TEN: 'CONG TY TNHH MAI LINH',
            SO_CCCD_MST: '0108928374',
          },
        ],
      },
      {
        sheetName: '2_HopDong',
        description: 'Hợp đồng cấp tín dụng (HD001, HD002, HD003)',
        sampleData: [
          {
            TTC01: '79301001',
            TTC03: 'CIF88392019',
            HD001: 'HDTD-2026-001',
            HD002: '20260115',
            HD003: '20280115',
            SO_HOP_DONG: 'HDTD-2026-001',
            HAN_MUC_CAP: 500000000,
            LOAI_TIEN: 'VND',
          },
          {
            TTC01: '79301001',
            TTC03: 'CIF99281722',
            HD001: 'HDTD-2026-002',
            HD002: '20260301',
            HD003: '20270301',
            SO_HOP_DONG: 'HDTD-2026-002',
            HAN_MUC_CAP: 2000000000,
            LOAI_TIEN: 'VND',
          },
        ],
      },
      {
        sheetName: '3_KhoanVay',
        description: 'Khế ước giải ngân & Dư nợ khoản vay (KU001...KU022)',
        sampleData: [
          {
            TTC01: '79301001',
            TTC03: 'CIF88392019',
            HD001: 'HDTD-2026-001',
            KU001: 'KU-2026-01',
            KU005: '20260115',
            KU006: '20270115',
            KU009: 280000000,
            KU010: 280000000,
            KU011: 0,
            KU012: 1,
            KU013: 8.5,
            KU021: 280000000,
            KU022: '01',
            DU_NO_HIEN_TAI: 280000000,
            NHOM_NO: '1',
          },
          {
            TTC01: '79301001',
            TTC03: 'CIF99281722',
            HD001: 'HDTD-2026-002',
            KU001: 'KU-2026-02',
            KU005: '20260301',
            KU006: '20270301',
            KU009: 1200000000,
            KU010: 1200000000,
            KU011: 0,
            KU012: 1,
            KU013: 9.0,
            KU021: 1200000000,
            KU022: '01',
            DU_NO_HIEN_TAI: 1200000000,
            NHOM_NO: '1',
          },
        ],
      },
      {
        sheetName: '4_TaiSanBaoDam',
        description: 'Tài sản bảo đảm tiền vay (TSBD)',
        sampleData: [
          {
            TTC01: '79301001',
            TTC03: 'CIF88392019',
            HD001: 'HDTD-2026-001',
            MA_TSBD: 'TSBD-01',
            LOAI_TSBD: 'BDS',
            GIA_TRI_DINH_GIA: 1200000000,
            GIA_TRI_BAO_DAM: 800000000,
            MO_TA: 'Bat dong san so do so 1234 Quan 1',
          },
        ],
      },
      {
        sheetName: '5_CamKetNgoaiBang',
        description: 'Cam kết bảo lãnh, mở L/C ngoài bảng (CK001...CT011)',
        sampleData: [
          {
            TTC01: '79301001',
            TTC03: 'CIF99281722',
            CK001: 'CK-2026-001',
            CK002: '20260201',
            CK003: 500000000,
            CT001: 'CTCK-01',
            CT006: 500000000,
            CT007: 500000000,
            CT008: 0,
            CT010: 1,
            CT011: '01',
          },
        ],
      },
      {
        sheetName: '6_NoXuLyRuiRo',
        description: 'Các khoản nợ đã xử lý bằng dự phòng rủi ro (NGB01...NGB04)',
        sampleData: [
          {
            TTC01: '79301001',
            TTC03: 'CIF88392019',
            NGB01: 'XLRR-2025-01',
            NGB03: 45000000,
            NGB04: '20251120',
          },
        ],
      },
      {
        sheetName: '7_NhanUyThac',
        description: 'Cho vay bằng vốn nhận ủy thác (NHD01...NKU15)',
        sampleData: [
          {
            TTC01: '79301001',
            TTC03: 'CIF99281722',
            NHD01: 'UT-2026-01',
            NHD05: 300000000,
            NHD06: 'VND',
            NKU01: 'NKU-01',
            NKU04: 300000000,
            NKU05: '20260101',
            NKU07: '20270101',
            NKU08: 300000000,
            NKU09: 0,
            NKU14: 1,
            NKU15: '01',
          },
        ],
      },
    ],
  };
};

/**
 * Cấu hình chuẩn QĐ 573 Mẫu 01 cho Báo Cáo D10
 * Gồm 2 sheet: Khách hàng cá nhân (KHCN) và Khách hàng doanh nghiệp (KHDN)
 */
const getD10StandardConfig = (fields?: ReportTemplateField[], reportName?: string): ReportSheetConfig => {
  return {
    reportCode: 'D10',
    reportName: reportName || 'Báo cáo thông tin khách hàng vay & quan hệ tín dụng (QĐ 573 Mẫu 01)',
    sheetCount: 2,
    sheets: [
      {
        sheetName: '1_KHCN_CaNhan',
        description: 'Thông tin khách hàng cá nhân (M01_KHCN)',
        sampleData: [
          {
            TTC01: '79301001',
            TTC02: 'CHI NHANH TP HO CHI MINH',
            TTC03: 'CIF88392019',
            TTC04: 'NGUYEN VAN A',
            CN001: 'CIF88392019',
            CN002: '19850615',
            CN004: '01',
            CN008: '001085001234',
          },
          {
            TTC01: '79301001',
            TTC02: 'CHI NHANH TP HO CHI MINH',
            TTC03: 'CIF88392020',
            TTC04: 'TRAN THI B',
            CN001: 'CIF88392020',
            CN002: '19901202',
            CN004: '01',
            CN008: '079190005678',
          },
        ],
      },
      {
        sheetName: '2_KHDN_DoanhNghiep',
        description: 'Thông tin khách hàng doanh nghiệp & tổ chức (M01_KHDN)',
        sampleData: [
          {
            TTC01: '79301001',
            TTC02: 'CHI NHANH TP HO CHI MINH',
            TTC03: 'CIF99281722',
            TTC04: 'CONG TY TNHH MAI LINH',
            DN001: 'CIF99281722',
            DN002: 'CONG TY TNHH MAI LINH',
            DN003: '0108928374',
          },
        ],
      },
    ],
  };
};

/**
 * Tự động phân chia Sheet cho các biểu mẫu tùy biến (D99...)
 */
const deriveGenericSheetsFromFields = (
  reportCode: string,
  reportName?: string,
  fields: ReportTemplateField[] = []
): ReportSheetConfig | null => {
  const rootGroups = new Map<string, ReportTemplateField[]>();

  fields.forEach((f) => {
    // Bỏ qua header báo cáo KB001..KB004
    if (f.indicatorCode.startsWith('KB')) return;

    let group = 'DuLieu';
    const code = f.indicatorCode;
    const path = f.jsonPath || '';

    if (code.startsWith('CN')) {
      group = 'KHCN_CaNhan';
    } else if (code.startsWith('DN')) {
      group = 'KHDN_DoanhNghiep';
    } else if (code.startsWith('HD') || path.includes('CHOVAY')) {
      group = 'HopDong';
    } else if (code.startsWith('KU') || path.includes('KHEUOC')) {
      group = 'KhoanVay';
    } else if (code.startsWith('TS') || path.includes('TSBD')) {
      group = 'TaiSanBaoDam';
    } else if (code.startsWith('CK') || code.startsWith('CT') || path.includes('CAMKET')) {
      group = 'CamKetNgoaiBang';
    } else if (code.startsWith('NGB') || path.includes('NOXLRR')) {
      group = 'NoXuLyRuiRo';
    } else if (code.startsWith('NHD') || code.startsWith('NKU') || path.includes('NHANUT')) {
      group = 'NhanUyThac';
    } else if (path.includes('.')) {
      const parts = path.split('.');
      const sub = parts[parts.length - 2]?.replace('[]', '') || parts[0].replace('[]', '');
      if (sub && sub !== 'CNTCTD' && sub !== 'KHACHHANG') {
        group = sub;
      }
    }

    if (!rootGroups.has(group)) {
      rootGroups.set(group, []);
    }
    rootGroups.get(group)!.push(f);
  });

  if (rootGroups.size > 0) {
    const sheets = Array.from(rootGroups.entries()).map(([groupName, groupFields], index) => {
      const sampleRow: Record<string, any> = { TTC01: '79301001', TTC03: 'CIF88392019' };
      groupFields.forEach((f) => {
        sampleRow[f.indicatorCode] = getSampleValueForField(f);
      });
      return {
        sheetName: `${index + 1}_${groupName}`,
        description: `Bảng dữ liệu phần ${groupName} (${groupFields.length} chỉ tiêu)`,
        sampleData: [sampleRow],
      };
    });

    return {
      reportCode,
      reportName: reportName || `Biểu mẫu ${reportCode}`,
      sheetCount: sheets.length,
      sheets,
    };
  }

  return null;
};

const getSampleValueForField = (f: ReportTemplateField) => {
  if (f.indicatorCode === 'KB001') return '20260902';
  if (f.indicatorCode === 'KB003') return '79301001';
  if (f.indicatorCode === 'CN001' || f.indicatorCode === 'TTC03') return 'CIF88392019';
  if (f.indicatorCode === 'CN004') return 'NGUYEN VAN A';
  if (f.indicatorCode === 'CN008') return '001085001234';
  if (f.indicatorCode === 'HD001') return 'HDTD-2026-0089';
  if (f.indicatorCode === 'KU001') return 'KU-2026-0012';
  if (f.indicatorCode === 'KU009' || f.indicatorCode === 'LOAI_TIEN') return 'VND';
  if (f.dataType === 'N') return 150000000;
  if (f.dataType === 'D') return '20260115';
  return `SAMPLE_${f.indicatorCode}`;
};

const generateSampleRowForPrefix = (prefix: string, fields: ReportTemplateField[]) => {
  const matching = fields.filter((f) => f.indicatorCode.startsWith(prefix));
  const row: Record<string, any> = { TTC01: '79301001', TTC03: 'CIF88392019' };
  if (matching.length > 0) {
    matching.forEach((f) => (row[f.indicatorCode] = getSampleValueForField(f)));
  } else {
    row[`${prefix}001`] = 'SAMPLE_DATA';
  }
  return row;
};

export const downloadMultiSheetExcelTemplate = async (
  reportCode: string,
  template?: ReportTemplate | null,
  cachedFields?: ReportTemplateField[]
) => {
  try {
    message.loading({
      content: `Đang tạo file Excel mẫu cho biểu mẫu ${reportCode}...`,
      key: 'dl_excel',
    });

    let fields = cachedFields;
    if (!fields || fields.length === 0) {
      try {
        fields = await catalogApi.getTemplateFields(reportCode);
      } catch {
        fields = [];
      }
    }

    const config = resolveReportSheetConfig(reportCode, template, fields);

    const wb = XLSX.utils.book_new();

    config.sheets.forEach((sheet) => {
      const ws = XLSX.utils.json_to_sheet(sheet.sampleData);
      XLSX.utils.book_append_sheet(wb, ws, sheet.sheetName);
    });

    XLSX.writeFile(wb, `Mau_Nhap_Lieu_${reportCode}_${config.sheetCount}_Sheets.xlsx`);
    message.success({
      content: `Đã tải xuống file Mau_Nhap_Lieu_${reportCode}_${config.sheetCount}_Sheets.xlsx (${config.sheetCount} Sheets: ${config.sheets.map((s) => s.sheetName).join(', ')})`,
      key: 'dl_excel',
    });
  } catch (err) {
    console.error('Lỗi khi tải file template:', err);
    message.error({
      content: 'Không thể tạo file mẫu Excel đa sheet',
      key: 'dl_excel',
    });
  }
};
