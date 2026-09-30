import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Checkbox, Collapse, Input, InputNumber, Modal, Space, Table, Tag, Typography, Upload, message } from 'antd';
import { CheckCircleOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import type { CicReportVersion } from '@/types';
import { reportingApi } from '@/api/reporting.api';
import { ContextualHelp } from '@/components/ContextualHelp';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;
type GridValues = Record<string, Record<string, number>>;
type Formula = { lineCode: string; columnCode: string; expression: string };
type CellMapping = { lineCode: string; columnCode: string; workbookSheet: string; excelRow: number; excelColumn: number };
type FormulaTranslation = { lineCode: string; columnCode: string; excelFormula: string; expression: string | null; status: 'TRANSLATABLE' | 'REVIEW_REQUIRED'; reason: string | null };

interface ReportAdjustmentModalProps {
  open: boolean;
  version: CicReportVersion | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReportAdjustmentModal: React.FC<ReportAdjustmentModalProps> = ({ open, version, onClose, onSuccess }) => {
  const [sheetCode, setSheetCode] = useState('');
  const [values, setValues] = useState<GridValues>({});
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [reason, setReason] = useState('');
  const [adjustedBy, setAdjustedBy] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formulaLineCode, setFormulaLineCode] = useState('');
  const [formulaColumnCode, setFormulaColumnCode] = useState('');
  const [formulaExpression, setFormulaExpression] = useState('');
  const [mappings, setMappings] = useState<CellMapping[]>([]);
  const [mappingLineCode, setMappingLineCode] = useState('');
  const [mappingColumnCode, setMappingColumnCode] = useState('');
  const [mappingWorkbookSheet, setMappingWorkbookSheet] = useState('');
  const [mappingExcelRow, setMappingExcelRow] = useState<number | null>(null);
  const [mappingExcelColumn, setMappingExcelColumn] = useState<number | null>(null);
  const [mappingImportReviewed, setMappingImportReviewed] = useState(false);
  const [formulaImportReviewed, setFormulaImportReviewed] = useState(false);
  const [formulaTranslations, setFormulaTranslations] = useState<FormulaTranslation[]>([]);

  useEffect(() => {
    if (open && version) {
      setSheetCode(version.reportCode);
      setValues({});
      setFormulas([]);
      setMappings([]);
      setReason('');
      setAdjustedBy(version.submittedBy || '');
      setMappingImportReviewed(false);
      setFormulaImportReviewed(false);
      setFormulaTranslations([]);
    }
  }, [open, version]);

  const loadSheet = async () => {
    if (!version || !sheetCode.trim()) return message.warning('Nhập mã sheet/biểu mẫu cần điều chỉnh');
    try {
      setLoading(true);
      const [cells, configuredFormulas, configuredMappings] = await Promise.all([
        reportingApi.getReportVersionCells(version.id, sheetCode.trim()),
        reportingApi.getReportCalculationFormulas(version.reportCode, sheetCode.trim()),
        reportingApi.getReportCellMappings(version.reportCode, sheetCode.trim()),
      ]);
      setValues(cells || {});
      setFormulas(configuredFormulas || []);
      setMappings(configuredMappings || []);
      if (!Object.keys(cells || {}).length) message.info('Sheet này chưa có số liệu BI để điều chỉnh.');
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không đọc được số liệu báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const updateDetailCell = async (lineCode: string, columnCode: string, next: number | null) => {
    const nextValues = {
      ...values,
      [lineCode]: { ...values[lineCode], [columnCode]: Number(next ?? 0) },
    };
    setValues(nextValues);
    if (!formulas.length) return;
    try {
      setValues(await reportingApi.previewReportCalculation({ values: nextValues, formulas }));
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể tính lại dòng tổng');
    }
  };

  const columns = useMemo(() => {
    const codes = [...new Set(Object.values(values).flatMap((row) => Object.keys(row)))];
    const formulaTargets = new Set(formulas.map((formula) => `${formula.lineCode}\u0000${formula.columnCode}`));
    return [
      { title: 'Mã dòng', dataIndex: 'lineCode', fixed: 'left' as const, width: 140 },
      ...codes.map((columnCode) => ({
        title: columnCode,
        dataIndex: columnCode,
        width: 180,
        render: (value: number | undefined, row: { lineCode: string }) => (
          <InputNumber value={value} precision={2} style={{ width: '100%' }}
            disabled={formulaTargets.has(`${row.lineCode}\u0000${columnCode}`)}
            onChange={(next) => updateDetailCell(row.lineCode, columnCode, next)} />
        ),
      })),
    ];
  }, [values, formulas]);

  const rows = useMemo(() => Object.entries(values).map(([lineCode, row]) => ({ key: lineCode, lineCode, ...row })), [values]);

  const handleRecalculate = async () => {
    try {
      setValues(await reportingApi.previewReportCalculation({ values, formulas }));
      message.success('Đã tính lại các dòng tổng theo cấu hình.');
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể tính lại dòng tổng');
    }
  };

  const saveFormula = async () => {
    if (!version || !sheetCode.trim() || !formulaLineCode.trim() || !formulaColumnCode.trim() || !formulaExpression.trim()) {
      return message.warning('Nhập đủ mã dòng tổng, mã cột và biểu thức');
    }
    try {
      await reportingApi.saveReportCalculationFormula({
        reportCode: version.reportCode, sheetCode: sheetCode.trim(), lineCode: formulaLineCode.trim(),
        columnCode: formulaColumnCode.trim(), expression: formulaExpression.trim(),
      });
      setFormulas(await reportingApi.getReportCalculationFormulas(version.reportCode, sheetCode.trim()));
      setFormulaLineCode(''); setFormulaColumnCode(''); setFormulaExpression('');
      message.success('Đã lưu công thức tổng.');
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể lưu công thức');
    }
  };

  const saveMapping = async () => {
    if (!version || !sheetCode.trim() || !mappingLineCode.trim() || !mappingColumnCode.trim() || !mappingWorkbookSheet.trim()
      || !mappingExcelRow || !mappingExcelColumn) return message.warning('Nhập đủ mã ô và tọa độ Excel');
    try {
      await reportingApi.saveReportCellMapping({ reportCode: version.reportCode, sheetCode: sheetCode.trim(),
        lineCode: mappingLineCode.trim(), columnCode: mappingColumnCode.trim(), workbookSheet: mappingWorkbookSheet.trim(),
        excelRow: mappingExcelRow, excelColumn: mappingExcelColumn });
      setMappings(await reportingApi.getReportCellMappings(version.reportCode, sheetCode.trim()));
      setMappingLineCode(''); setMappingColumnCode(''); setMappingWorkbookSheet(''); setMappingExcelRow(null); setMappingExcelColumn(null);
      message.success('Đã lưu mapping ô Excel.');
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể lưu mapping ô Excel');
    }
  };

  const importReviewedMappings = async (file: File) => {
    try {
      if (!version || !sheetCode.trim()) throw new Error('Chọn sheet trước khi nhập mapping');
      if (!mappingImportReviewed) throw new Error('Xác nhận đã rà soát mapping trước khi nhập');
      const payload = JSON.parse(await file.text());
      if (!Array.isArray(payload.mappings) || !payload.mappings.length) throw new Error('Không có mappings');
      const mappingsForCurrentSheet = payload.mappings.filter((item: CellMapping & { reportCode: string; sheetCode: string }) =>
        item.reportCode === version.reportCode && item.sheetCode === sheetCode.trim());
      if (!mappingsForCurrentSheet.length) throw new Error(`Không có mapping cho ${version.reportCode}/${sheetCode.trim()}`);
      await reportingApi.saveReportCellMappings(mappingsForCurrentSheet);
      setMappings(await reportingApi.getReportCellMappings(version.reportCode, sheetCode.trim()));
      message.success(`Đã nhập ${mappingsForCurrentSheet.length} mapping đã rà soát cho sheet hiện tại.`);
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Tệp JSON mapping không hợp lệ');
    }
    return false;
  };

  const importFormulaSuggestions = async (file: File) => {
    try {
      if (!version || !sheetCode.trim()) throw new Error('Chọn sheet trước khi nhập công thức');
      if (!formulaImportReviewed) throw new Error('Xác nhận đã rà soát gợi ý công thức trước khi nhập');
      const payload = JSON.parse(await file.text());
      const mappingsForCurrentSheet = (payload.mappings || []).filter((item: CellMapping & { reportCode: string; sheetCode: string }) =>
        item.reportCode === version.reportCode && item.sheetCode === sheetCode.trim());
      const suggestionsForCurrentSheet = (payload.formulaSuggestions || []).filter((item: { reportCode: string; sheetCode: string }) =>
        item.reportCode === version.reportCode && item.sheetCode === sheetCode.trim());
      if (!mappingsForCurrentSheet.length || !suggestionsForCurrentSheet.length) {
        throw new Error(`Không có mapping hoặc công thức cho ${version.reportCode}/${sheetCode.trim()}`);
      }
      const preview = await reportingApi.previewFormulaSuggestions({
        mappings: mappingsForCurrentSheet,
        formulaSuggestions: suggestionsForCurrentSheet,
      });
      setFormulaTranslations(preview || []);
      message.success(`Đã phân tích ${preview.length} gợi ý công thức.`);
    } catch (error: any) {
      message.error(error?.response?.data?.message || error?.message || 'Không thể đọc gợi ý công thức');
    }
    return false;
  };

  const applyTranslatedFormulas = async () => {
    if (!version || !sheetCode.trim()) return;
    const applicable = formulaTranslations.filter((item) => item.status === 'TRANSLATABLE' && item.expression);
    if (!applicable.length) return message.warning('Không có công thức nào chuyển đổi được để áp dụng');
    try {
      await reportingApi.saveReportCalculationFormulas(applicable.map((item) => ({
        reportCode: version.reportCode, sheetCode: sheetCode.trim(), lineCode: item.lineCode,
        columnCode: item.columnCode, expression: item.expression!,
      })));
      const configured = await reportingApi.getReportCalculationFormulas(version.reportCode, sheetCode.trim());
      setFormulas(configured || []);
      if (Object.keys(values).length) setValues(await reportingApi.previewReportCalculation({ values, formulas: configured || [] }));
      message.success(`Đã áp dụng ${applicable.length} công thức tổng.`);
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể áp dụng lô công thức');
    }
  };

  const save = async () => {
    if (!version || !reason.trim()) return message.warning('Nhập lý do điều chỉnh');
    if (!adjustedBy.trim()) return message.warning('Nhập người thực hiện điều chỉnh');
    if (!Object.keys(values).length) return message.warning('Nạp số liệu BI của sheet trước khi lưu');
    try {
      setSubmitting(true);
      const finalValues = formulas.length ? await reportingApi.previewReportCalculation({ values, formulas }) : values;
      const result = await reportingApi.saveReportAdjustment({
        sourceVersionId: version.id, sheetCode: sheetCode.trim(), reason: reason.trim(), adjustedBy: adjustedBy.trim(), values: finalValues,
      });
      message.success(`Đã tạo phiên bản điều chỉnh v${result.versionNumber}.`);
      onSuccess(); onClose();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể lưu phiên bản điều chỉnh');
    } finally {
      setSubmitting(false);
    }
  };

  if (!version) return null;
  return <Modal title={<Space><EditOutlined style={{ color: '#003B95' }} /><span>Điều chỉnh trực tiếp: {version.reportCode} v{version.versionNumber}</span><ContextualHelp inline content="Sửa dòng chi tiết sẽ tự tính lại dòng tổng và lưu thành phiên bản mới. Số liệu BI được giữ nguyên ở phiên bản nguồn; chỉ phiên bản điều chỉnh mới được dùng để xuất và nộp SBV." /></Space>}
    open={open} onCancel={onClose} width={1100}
    footer={[<Button key="cancel" onClick={onClose}>Hủy</Button>, <Button key="save" type="primary" icon={<CheckCircleOutlined />} loading={submitting} onClick={save}>Lưu & tạo version mới</Button>]}
  >
    <Card size="small" style={{ marginBottom: 16 }}><Space wrap>
      <Text>Mã sheet/biểu mẫu</Text><Input value={sheetCode} onChange={(event) => setSheetCode(event.target.value)} style={{ width: 220 }} />
      <Button icon={<ReloadOutlined />} loading={loading} onClick={loadSheet}>Nạp số liệu BI</Button><Tag color="blue">{formulas.length} công thức tổng</Tag>
      <Button disabled={!rows.length} onClick={handleRecalculate}>Tính lại tổng</Button>
    </Space></Card>
    <Collapse size="small" style={{ marginBottom: 16 }} items={[{ key: 'formulas', label: `Cấu hình công thức tổng (${formulas.length})`, children: <>
      <Paragraph type="secondary">Nhập công thức được AI gợi ý sau khi nghiệp vụ xác nhận; dùng mã dòng, ví dụ <Text code>998 + 999</Text>. Công thức nhiều cấp được tính tự động.</Paragraph>
      <Space wrap>
        <Input value={formulaLineCode} onChange={(event) => setFormulaLineCode(event.target.value)} placeholder="Mã dòng tổng" style={{ width: 150 }} />
        <Input value={formulaColumnCode} onChange={(event) => setFormulaColumnCode(event.target.value)} placeholder="Mã cột" style={{ width: 120 }} />
        <Input value={formulaExpression} onChange={(event) => setFormulaExpression(event.target.value)} placeholder="998 + 999" style={{ width: 240 }} />
        <Button onClick={saveFormula}>Lưu công thức</Button>
      </Space>
      <Paragraph type="secondary" style={{ marginTop: 16 }}>Có thể nạp JSON scanner để tự chuyển công thức Excel đơn giản thành mã dòng. Công thức không hỗ trợ sẽ chỉ hiển thị lý do và không được áp dụng.</Paragraph>
      <Space wrap>
        <Upload accept=".json,application/json" showUploadList={false} beforeUpload={importFormulaSuggestions} disabled={!formulaImportReviewed}>
          <Button>Phân tích JSON công thức</Button>
        </Upload>
        <Button type="primary" disabled={!formulaTranslations.some((item) => item.status === 'TRANSLATABLE' && item.expression)} onClick={applyTranslatedFormulas}>
          Áp dụng {formulaTranslations.filter((item) => item.status === 'TRANSLATABLE' && item.expression).length} công thức chuyển được
        </Button>
      </Space>
      <Checkbox checked={formulaImportReviewed} onChange={(event) => setFormulaImportReviewed(event.target.checked)} style={{ display: 'block', marginTop: 12 }}>
        Tôi đã chọn đúng file nguồn, report và sheet trước khi tự chuyển công thức Excel.
      </Checkbox>
      {formulaTranslations.length > 0 && <Table size="small" style={{ marginTop: 12 }} pagination={{ pageSize: 6 }} rowKey={(item) => `${item.lineCode}-${item.columnCode}-${item.excelFormula}`}
        dataSource={formulaTranslations} columns={[
          { title: 'Excel', dataIndex: 'excelFormula', width: 250 },
          { title: 'Công thức app', dataIndex: 'expression', width: 220, render: (value) => value || '-' },
          { title: 'Trạng thái', dataIndex: 'status', width: 140, render: (value) => <Tag color={value === 'TRANSLATABLE' ? 'green' : 'orange'}>{value}</Tag> },
          { title: 'Lý do', dataIndex: 'reason', render: (value) => value || '-' },
        ]} />}
      {formulas.length > 0 && <Paragraph style={{ marginTop: 12, marginBottom: 0 }}>{formulas.map((formula) => <Tag key={`${formula.lineCode}-${formula.columnCode}`}>{formula.lineCode}.{formula.columnCode} = {formula.expression}</Tag>)}</Paragraph>}
    </> }]} />
    <Collapse size="small" style={{ marginBottom: 16 }} items={[{ key: 'mappings', label: `Mapping ô Excel để xuất SBV (${mappings.length})`, children: <>
      <Paragraph type="secondary">Khai báo sheet và tọa độ theo biểu mẫu Excel chính thức. Dòng/cột đã khai báo sẽ được ghi từ version cuối khi xuất.</Paragraph>
      <Space wrap>
        <Input value={mappingLineCode} onChange={(event) => setMappingLineCode(event.target.value)} placeholder="Mã dòng" style={{ width: 120 }} />
        <Input value={mappingColumnCode} onChange={(event) => setMappingColumnCode(event.target.value)} placeholder="Mã cột" style={{ width: 110 }} />
        <Input value={mappingWorkbookSheet} onChange={(event) => setMappingWorkbookSheet(event.target.value)} placeholder="Tên sheet Excel" style={{ width: 160 }} />
        <InputNumber value={mappingExcelRow} min={1} onChange={setMappingExcelRow} placeholder="Dòng" style={{ width: 90 }} />
        <InputNumber value={mappingExcelColumn} min={1} onChange={setMappingExcelColumn} placeholder="Cột" style={{ width: 90 }} />
        <Button onClick={saveMapping}>Lưu mapping</Button>
        <Upload accept=".json,application/json" showUploadList={false} beforeUpload={importReviewedMappings} disabled={!mappingImportReviewed}>
          <Button>Nhập JSON đã rà soát</Button>
        </Upload>
      </Space>
      <Checkbox checked={mappingImportReviewed} onChange={(event) => setMappingImportReviewed(event.target.checked)} style={{ marginTop: 12 }}>
        Tôi đã đối chiếu mapping AI với biểu mẫu chính thức và chỉ nhập cho report/sheet đang mở.
      </Checkbox>
      {mappings.length > 0 && <Paragraph style={{ marginTop: 12, marginBottom: 0 }}>{mappings.map((mapping) => <Tag key={`${mapping.lineCode}-${mapping.columnCode}`}>{mapping.lineCode}.{mapping.columnCode} → {mapping.workbookSheet}!R{mapping.excelRow}C{mapping.excelColumn}</Tag>)}</Paragraph>}
    </> }]} />
    <Table size="small" bordered loading={loading} dataSource={rows} columns={columns} pagination={{ pageSize: 12 }} scroll={{ x: 'max-content', y: 360 }} />
    <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 12 }}>Dòng tổng được xác định từ cấu hình công thức theo mã dòng, ví dụ <Text code>998 + 999</Text>.</Paragraph>
    <Text strong>Người điều chỉnh <Text type="danger">*</Text></Text>
    <Input value={adjustedBy} onChange={(event) => setAdjustedBy(event.target.value)} placeholder="Mã nhân sự hoặc tài khoản thực hiện" style={{ margin: '4px 0 12px' }} />
    <Text strong>Lý do điều chỉnh <Text type="danger">*</Text></Text>
    <TextArea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ví dụ: Điều chỉnh số dư của dòng 998 theo biên bản đối soát..." />
  </Modal>;
};
