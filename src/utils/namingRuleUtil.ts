/**
 * Tiện ích quản lý và áp dụng Quy chuẩn Đặt tên Tệp Nộp Báo cáo
 * Hỗ trợ đa cơ quan: CIC (TT15 / QĐ 573), SBV (Ngân hàng Nhà nước), PCB
 * Quy tắc: Cấu hình tập trung tại Màn Cài Đặt, Live Preview kiểm tra tại Màn Tạo.
 */

export interface AgencyNamingRule {
  agency: 'CIC' | 'SBV' | 'PCB';
  agencyName: string;
  unitCode: string; // VD: PTF đối với CIC/PCB, 79301001 đối với SBV
  pattern: string; // Biểu thức mẫu: {REPORT_CODE}{UNIT_CODE}{DATE}.{SEQUENCE}.zip
  extension: string; // .zip, .xml, .json
  sequenceDigits: number; // 3 => "001"
  description: string;
  legalBasis: string;
}

export const DEFAULT_NAMING_RULES: Record<string, AgencyNamingRule> = {
  CIC: {
    agency: 'CIC',
    agencyName: 'Trung tâm Thông tin Tín dụng Quốc gia (CIC)',
    unitCode: '79301001',
    pattern: '{REPORT_CODE}{UNIT_CODE}{DATE}.{SEQUENCE}.zip',
    extension: '.zip',
    sequenceDigits: 3,
    description: 'Quy chuẩn đóng gói nộp CIC theo Quyết định 573/QĐ-NHNN & Thông tư 15/2023/TT-NHNN',
    legalBasis: 'Quyết định 573/QĐ-NHNN & Thông tư 15/2023/TT-NHNN',
  },
  SBV: {
    agency: 'SBV',
    agencyName: 'Cổng Giám sát Ngân hàng Nhà nước Việt Nam (SBV)',
    unitCode: '79301001',
    pattern: '{UNIT_CODE}_{REPORT_CODE}_{DATE}.xml',
    extension: '.xml',
    sequenceDigits: 0,
    description: 'Quy chuẩn truyền số liệu điện tử theo Thông tư 35/2015/TT-NHNN & Thông tư 41/2016/TT-NHNN',
    legalBasis: 'Thông tư 35/2015/TT-NHNN & Thông tư 41/2016/TT-NHNN',
  },
  PCB: {
    agency: 'PCB',
    agencyName: 'Công ty Cổ phần Thông tin Tín dụng Việt Nam (PCB)',
    unitCode: '79301001',
    pattern: 'PCB_{REPORT_CODE}_{UNIT_CODE}_{DATE}.{SEQUENCE}.zip',
    extension: '.zip',
    sequenceDigits: 3,
    description: 'Quy chuẩn đóng gói định dạng PCB theo Nghị định 58/2021/NĐ-CP',
    legalBasis: 'Nghị định 58/2021/NĐ-CP & Quy chuẩn dữ liệu PCB',
  },
};

const STORAGE_KEY = 'tt15_agency_naming_rules';

/**
 * Lấy toàn bộ quy chuẩn đặt tên từ localStorage (kèm fallback mặc định)
 */
export const getAgencyNamingRules = (): Record<string, AgencyNamingRule> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NAMING_RULES;
    const parsed = JSON.parse(raw);
    const rules: Record<string, AgencyNamingRule> = {
      CIC: { ...DEFAULT_NAMING_RULES.CIC, ...(parsed.CIC || {}) },
      SBV: { ...DEFAULT_NAMING_RULES.SBV, ...(parsed.SBV || parsed.SVB || {}) },
      PCB: { ...DEFAULT_NAMING_RULES.PCB, ...(parsed.PCB || {}) },
    };
    // Đảm bảo chuẩn mã số TCTD do NHNN cấp theo QĐ 573 / Thông tư 15
    if (rules.CIC.unitCode === 'PTF') rules.CIC.unitCode = '79301001';
    if (rules.PCB.unitCode === 'PTF') rules.PCB.unitCode = '79301001';
    return rules;
  } catch {
    return DEFAULT_NAMING_RULES;
  }
};

/**
 * Lấy quy chuẩn cho một cơ quan cụ thể
 */
export const getAgencyRule = (agency?: string): AgencyNamingRule => {
  const rules = getAgencyNamingRules();
  const normalized = (agency || 'CIC').toUpperCase();
  if (normalized === 'SBV' || normalized === 'SVB') return rules.SBV;
  if (normalized === 'PCB') return rules.PCB;
  return rules.CIC;
};

/**
 * Lưu quy chuẩn đặt tên vào localStorage
 */
export const saveAgencyNamingRules = (rules: Record<string, AgencyNamingRule>): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
  } catch (e) {
    console.error('Không thể lưu quy chuẩn tên tệp vào localStorage:', e);
  }
};

/**
 * Lưu cập nhật cho 1 cơ quan
 */
export const updateAgencyRule = (agency: 'CIC' | 'SBV' | 'PCB', update: Partial<AgencyNamingRule>): void => {
  const all = getAgencyNamingRules();
  all[agency] = { ...all[agency], ...update };
  saveAgencyNamingRules(all);
};

/**
 * Nhận diện cơ quan đích từ mã biểu mẫu
 * Quy tắc:
 * - D... -> CIC (D10, D11, D12...)
 * - B..., BC..., CAR..., TK... -> SBV
 * - PCB... -> PCB
 */
export const detectAgencyFromReportCode = (code?: string): 'CIC' | 'SBV' | 'PCB' => {
  if (!code) return 'CIC';
  const c = code.trim().toUpperCase();
  if (c.startsWith('PCB')) return 'PCB';
  if (c.startsWith('B') || c.startsWith('BC') || c.startsWith('CAR') || c.startsWith('TK') || c.startsWith('SBV')) {
    return 'SBV';
  }
  return 'CIC';
};

export interface GenerateFileNameParams {
  reportCode?: string;
  agency?: 'CIC' | 'SBV' | 'PCB' | string;
  unitCode?: string;
  reportingDate?: string;
  sequence?: number;
  customPattern?: string;
}

/**
 * Sinh tên tệp nộp chuẩn dựa trên pattern và các tham số
 */
export const generateFileNamePreview = (params: GenerateFileNameParams): string => {
  const { reportCode = 'D10', agency = 'CIC', reportingDate = '20260831', sequence = 1, customPattern } = params;

  const rule = getAgencyRule(agency);
  const uCode = (params.unitCode || rule.unitCode || '79301001').trim();
  const rCode = (reportCode || 'D10').toUpperCase().trim();
  const dateStr = reportingDate.replace(/[^0-9]/g, '').slice(0, 8) || '20260831';
  const seqStr = String(sequence || 1).padStart(rule.sequenceDigits || 3, '0');

  let pattern = (customPattern || rule.pattern || '{REPORT_CODE}{UNIT_CODE}{DATE}.{SEQUENCE}.zip').trim();

  // Thay thế các biến placeholder
  let fileName = pattern
    .replace(/\{REPORT_CODE\}/g, rCode)
    .replace(/\{UNIT_CODE\}/g, uCode)
    .replace(/\{DATE\}/g, dateStr)
    .replace(/\{YYYYMMDD\}/g, dateStr)
    .replace(/\{SEQUENCE\}/g, seqStr)
    .replace(/\{EXT\}/g, rule.extension.replace(/^\./, ''));

  // Đảm bảo có đuôi mở rộng nếu chưa có
  if (!fileName.includes('.')) {
    fileName = `${fileName}${rule.extension}`;
  }

  return fileName;
};
