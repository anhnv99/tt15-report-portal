import type { ReportTemplateField } from '@/types';

export const generateJsonSample = (reportCode: string, fields: ReportTemplateField[]): Record<string, any> => {
  const rootObj: Record<string, any> = {};

  const setNested = (obj: any, path: string, val: any) => {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (part.endsWith('[]')) {
        const key = part.slice(0, -2);
        if (!current[key]) {
          current[key] = [{}];
        }
        current = current[key][0];
      } else {
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
    }
    const last = parts[parts.length - 1];
    if (last.endsWith('[]')) {
      const key = last.slice(0, -2);
      if (!current[key]) {
        current[key] = [val];
      }
    } else {
      current[last] = val;
    }
  };

  const getExampleValue = (indicatorCode: string, dataType: string, maxLength?: number) => {
    if (indicatorCode === 'KB001') return '20260902';
    if (indicatorCode === 'KB002') return 'NGAN HANG TMCP TT15';
    if (indicatorCode === 'KB003') return '79301001';
    if (indicatorCode === 'KB004') return 'NGAN HANG NHA NUOC VIET NAM';
    if (indicatorCode.startsWith('TTC01')) return '79301001';
    if (indicatorCode.startsWith('TTC02')) return 'Chi nhanh Ha Noi';
    if (indicatorCode.startsWith('TTC03')) return 'CIF88392019';
    if (indicatorCode.startsWith('TTC04')) return 'CONG TY TNHH ABC VIET NAM';
    if (indicatorCode === 'CN001') return 'CIF88392019';
    if (indicatorCode === 'CN002') return '19850615';
    if (indicatorCode === 'CN003') return '1';
    if (indicatorCode === 'CN004') return 'NGUYEN VAN A';
    if (indicatorCode === 'CN008') return '001085001234';
    if (indicatorCode === 'HD001' || indicatorCode === 'HDT01') return 'HDTD-2026-0089';
    if (indicatorCode === 'KU001') return 'KU-2026-0012';
    if (indicatorCode === 'KU009' || indicatorCode === 'CT007' || indicatorCode === 'TP010') return 'VND';
    if (
      indicatorCode.includes('DATE') ||
      ((indicatorCode.endsWith('02') || indicatorCode.endsWith('03')) && dataType === 'C' && maxLength === 8)
    ) {
      return '20260115';
    }

    if (dataType === 'N') {
      if (maxLength && maxLength === 1) return 1;
      if (maxLength && maxLength <= 3) return 1;
      if (maxLength && maxLength <= 6) return 8.5;
      return 1500000000;
    }
    return `${indicatorCode}_VAL`;
  };

  fields.forEach((f) => {
    const val = getExampleValue(f.indicatorCode, f.dataType, f.maxLength);
    setNested(rootObj, f.jsonPath, val);
  });

  return rootObj;
};
