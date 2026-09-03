import { catalogApi } from '@/api/catalog.api';
import { message } from 'antd';

export const downloadSampleImportFile = async (reportCode: string) => {
  try {
    message.loading({ content: `Đang tạo tệp mẫu chuẩn cho ${reportCode}...`, key: 'dl_tpl' });
    const fields = await catalogApi.getTemplateFields(reportCode);

    if (!fields || fields.length === 0) {
      // Fallback standard headers for banking imports
      const defaultHeaders = [
        'MA_TCTD',
        'MA_CHI_NHANH',
        'CIF',
        'TEN_KHACH_HANG',
        'LOAI_KHACH_HANG',
        'SO_HOP_DONG',
        'SO_TIEN_VAY',
        'DU_NO_HIEN_TAI',
        'LOAI_TIEN',
        'LAI_SUAT',
        'NHOM_NO',
        'MUC_DICH_VAY',
        'NGAY_GIAI_NGAN',
        'NGAY_DAO_HAN',
      ];
      const sampleRow = [
        '79301001',
        '01201001',
        'CIF88392019',
        'NGUYEN VAN A',
        'CN',
        'HDTD-2026-001',
        '500000000',
        '450000000',
        'VND',
        '8.5',
        '1',
        'TD_TIEUDUNG',
        '20260115',
        '20280115',
      ];

      const csvContent = '\uFEFF' + [defaultHeaders.join(','), sampleRow.join(',')].join('\r\n');
      triggerDownload(csvContent, `Mau_Nhap_Lieu_${reportCode}_QD573.csv`);
      message.success({ content: `Đã tải tệp mẫu Mau_Nhap_Lieu_${reportCode}_QD573.csv`, key: 'dl_tpl' });
      return;
    }

    // Build headers from indicators
    const headers = fields.map((f) => f.indicatorCode);
    const sampleValues = fields.map((f) => {
      if (f.indicatorCode === 'KB001') return '20260902';
      if (f.indicatorCode === 'KB003') return '79301001';
      if (f.indicatorCode === 'CN001') return 'CIF88392019';
      if (f.indicatorCode === 'CN004') return 'NGUYEN VAN A';
      if (f.indicatorCode === 'CN008') return '001085001234';
      if (f.indicatorCode === 'HD001') return 'HDTD-2026-0089';
      if (f.indicatorCode === 'KU009') return 'VND';
      if (f.dataType === 'N') return '150000000';
      if (f.dataType === 'D') return '20260115';
      return `SAMPLE_${f.indicatorCode}`;
    });

    const csvContent = '\uFEFF' + [headers.join(','), sampleValues.join(',')].join('\r\n');
    triggerDownload(csvContent, `Mau_Nhap_Lieu_${reportCode}_QD573.csv`);
    message.success({ content: `Đã tải tệp mẫu Mau_Nhap_Lieu_${reportCode}_QD573.csv (${fields.length} cột chỉ tiêu)`, key: 'dl_tpl' });
  } catch (err) {
    console.error(err);
    message.error({ content: 'Không thể tạo file mẫu, vui lòng thử lại', key: 'dl_tpl' });
  }
};

const triggerDownload = (content: string, fileName: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};
