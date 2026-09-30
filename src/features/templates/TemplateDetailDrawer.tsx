import React, { useState, useMemo, useEffect } from 'react';
import {
  Drawer,
  Spin,
  Tabs,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Popconfirm,
  Card,
  Form,
  Input,
  Select,
  Switch,
  Row,
  Col,
  List,
  Modal,
  Tooltip,
  message,
} from 'antd';
import {
  CheckSquareOutlined,
  UnorderedListOutlined,
  CodeOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  DownloadOutlined,
  AppstoreOutlined,
  FileExcelOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import type { ReportTemplate, ReportTemplateField, ReportTemplateRule } from '@/types';
import { catalogApi } from '@/api/catalog.api';
import { reportingApi } from '@/api/reporting.api';
import { ContextualHelp } from '@/components/ContextualHelp';
import { generateJsonSample } from './utils/jsonTemplateGenerator';
import {
  resolveReportSheetConfig,
  downloadMultiSheetExcelTemplate,
  downloadSbvOfficialExcelTemplate,
} from '@/features/imports/utils/multiSheetTemplateGenerator';
import { getReportDestinationProfile } from '@/features/reporting-destinations/profiles';
import { getTemplateDestinationProfile } from '@/features/reporting-destinations/resolveReportDestination';

const { Text } = Typography;

interface TemplateDetailDrawerProps {
  open: boolean;
  template: ReportTemplate | null;
  fields: ReportTemplateField[];
  rules: ReportTemplateRule[];
  loading: boolean;
  onClose: () => void;
  onOpenAddRule: () => void;
  onEditRule: (rule: ReportTemplateRule) => void;
  onDeleteRule: (ruleId: number) => Promise<void>;
  onAddField: (values: any) => Promise<void>;
  onUpdateField?: (fieldId: number, values: any) => Promise<void>;
  onDeleteField: (fieldId: number) => Promise<void>;
}

export const TemplateDetailDrawer: React.FC<TemplateDetailDrawerProps> = ({
  open,
  template,
  fields,
  rules,
  loading,
  onClose,
  onOpenAddRule,
  onEditRule,
  onDeleteRule,
  onAddField,
  onUpdateField,
  onDeleteField,
}) => {
  const [fieldForm] = Form.useForm();
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [makerCheckerLoading, setMakerCheckerLoading] = useState(false);
  const [requireMakerChecker, setRequireMakerChecker] = useState(template?.requireMakerChecker !== false);

  // SBV Row Mapping Modal state
  const [sbvRowModalOpen, setSbvRowModalOpen] = useState(false);
  const [editingSbvRow, setEditingSbvRow] = useState<ReportTemplateField | null>(null);
  const [sbvRowForm] = Form.useForm();
  const [savingRow, setSavingRow] = useState(false);
  const [exportMappingCoverage, setExportMappingCoverage] = useState({
    loading: false,
    count: 0,
    sheetCount: 0,
    failed: false,
  });

  useEffect(() => {
    if (template) {
      setRequireMakerChecker(template.requireMakerChecker !== false);
    }
  }, [template]);

  const handleToggleMakerChecker = async (checked: boolean) => {
    if (!template) return;
    try {
      setMakerCheckerLoading(true);
      await catalogApi.updateReportTemplate(template.reportCode, {
        templateNumber: template.templateNumber || '01',
        reportName: template.reportName,
        frequency: template.frequency || 'MONTHLY',
        dataPeriodTypeId: template.dataPeriodTypeId || 1,
        filePrefix: template.filePrefix || template.reportCode,
        rootStructure: template.rootStructure || '{}',
        sourceReference: template.sourceReference || '',
        isActive: template.isActive !== false,
        targetDestination: template.targetDestination || 'CIC',
        requireMakerChecker: checked,
      });
      setRequireMakerChecker(checked);
      template.requireMakerChecker = checked;
      message.success(`Đã cập nhật: ${checked ? 'Bắt buộc Maker-Checker phê duyệt' : 'Chạy tự động toàn trình (STP)'}`);
    } catch (e) {
      message.error('Không thể cập nhật cấu hình Maker-Checker');
    } finally {
      setMakerCheckerLoading(false);
    }
  };

  const destinationProfile = template ? getTemplateDestinationProfile(template) : getReportDestinationProfile('CIC');
  const isSbv = destinationProfile.supportsExcelMapping;

  const generatedDrawerJson = useMemo(() => {
    if (!fields.length || !template) return {};
    return generateJsonSample(template.reportCode, fields);
  }, [template, fields]);

  // Dynamically resolve input sheet configuration for this template
  const sheetConfig = useMemo(() => {
    if (!template) return null;
    return resolveReportSheetConfig(template.reportCode, template, fields);
  }, [template, fields]);

  useEffect(() => {
    let cancelled = false;
    if (!open || !template || !isSbv) {
      setExportMappingCoverage({ loading: false, count: 0, sheetCount: 0, failed: false });
      return () => { cancelled = true; };
    }
    setExportMappingCoverage((current) => ({ ...current, loading: true, failed: false }));
    reportingApi.getReportCellMappings(template.reportCode)
      .then((mappings) => {
        if (!cancelled) {
          setExportMappingCoverage({
            loading: false,
            count: mappings.length,
            sheetCount: new Set(mappings.map((mapping) => mapping.sheetCode)).size,
            failed: false,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setExportMappingCoverage({ loading: false, count: 0, sheetCount: 0, failed: true });
      });
    return () => { cancelled = true; };
  }, [open, template, isSbv]);

  const handleCopyJson = () => {
    const text = JSON.stringify(generatedDrawerJson, null, 2);
    navigator.clipboard.writeText(text);
    message.success('Đã sao chép cấu trúc JSON mẫu vào clipboard!');
  };

  const handleDownloadJson = () => {
    if (!template) return;
    const text = JSON.stringify(generatedDrawerJson, null, 2);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mau_${template.reportCode}_QD573_PL2.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success(`Đã tải xuống tệp Mau_${template.reportCode}_QD573_PL2.json`);
  };

  const handleAddFieldSubmit = async () => {
    try {
      const values = await fieldForm.validateFields();
      await onAddField({
        ...values,
        sourceReference: values.sourceReference?.trim() || template?.sourceReference || 'QĐ 573 / Phụ lục',
        maxLength: values.maxLength ? Number(values.maxLength) : undefined,
      });
      setAddFieldOpen(false);
      fieldForm.resetFields();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAddSbvRow = () => {
    setEditingSbvRow(null);
    sbvRowForm.resetFields();
    const isCreditRisk =
      (template?.reportCode || '').toUpperCase().startsWith('A') ||
      (template?.reportName || '').toLowerCase().includes('tín dụng') ||
      (template?.reportName || '').toLowerCase().includes('dư nợ') ||
      (template?.reportName || '').toLowerCase().includes('nợ xấu') ||
      (template?.reportName || '').toLowerCase().includes('giám sát') ||
      (template?.reportName || '').toLowerCase().includes('qlgs');

    sbvRowForm.setFieldsValue({
      dataType: 'N',
      maxLength: 18,
      mandatory: true,
      jsonPath: `ROW_${String(fields.length + 7).padStart(2, '0')}:COL_D_I`,
      stagingTable: isCreditRisk ? 'tempo_sbv_credit_risk' : 'tempo_sbv_candotk',
      indicatorCode: isCreditRisk ? `${(template?.reportCode || 'A1').replace(/[^a-zA-Z0-9]/g, '_')}_01` : '',
    });
    setSbvRowModalOpen(true);
  };

  const handleOpenEditSbvRow = (record: ReportTemplateField) => {
    setEditingSbvRow(record);
    sbvRowForm.resetFields();

    let indicatorName = record.sourceReference || '';
    let stagingTable = 'tempo_sbv_credit_risk';
    if (record.sourceReference && record.sourceReference.includes(' - tempo_')) {
      const parts = record.sourceReference.split(' - ');
      indicatorName = parts[0];
      stagingTable = parts[1] || stagingTable;
    } else if (record.sourceReference?.startsWith('tempo_')) {
      indicatorName = '';
      stagingTable = record.sourceReference;
    }

    sbvRowForm.setFieldsValue({
      indicatorCode: record.indicatorCode,
      indicatorName: indicatorName,
      jsonPath: record.jsonPath,
      stagingTable: stagingTable,
      dataType: record.dataType || 'N',
      maxLength: record.maxLength || 18,
      mandatory: record.mandatory !== false,
    });
    setSbvRowModalOpen(true);
  };

  const handleSaveSbvRow = async () => {
    try {
      const values = await sbvRowForm.validateFields();
      setSavingRow(true);

      const combinedSource = values.indicatorName?.trim()
        ? `${values.indicatorName.trim()} - ${values.stagingTable || 'tempo_sbv_credit_risk'}`
        : (values.stagingTable || 'tempo_sbv_credit_risk');

      const payload = {
        indicatorCode: values.indicatorCode.trim(),
        jsonPath: values.jsonPath?.trim(),
        dataType: values.dataType || 'N',
        maxLength: values.maxLength ? Number(values.maxLength) : 18,
        mandatory: values.mandatory !== false,
        sourceReference: combinedSource,
      };

      if (editingSbvRow && onUpdateField) {
        await onUpdateField(editingSbvRow.id, payload);
      } else {
        await onAddField(payload);
      }
      setSbvRowModalOpen(false);
      setEditingSbvRow(null);
      sbvRowForm.resetFields();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingRow(false);
    }
  };

  return (
    <Drawer
      title={
        <Space>
          <Tag color={destinationProfile.tagColor} style={{ fontWeight: 600 }}>
            {destinationProfile.label}
          </Tag>
          <span>
            {template?.reportCode || ''} — {template?.reportName || ''}
          </span>
          <ContextualHelp
            inline
            label="Hướng dẫn cấu hình biểu mẫu"
            content={
              <div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Hướng dẫn cấu hình biểu mẫu</div>
                <div>Rules được thực thi khi tổng hợp để kiểm tra định dạng, logic nghiệp vụ và đối soát chéo.</div>
                <div style={{ marginTop: 8 }}>
                  {destinationProfile.artifactDescription}. Cấu hình và dữ liệu chỉ áp dụng cho đích nộp này.
                </div>
                {isSbv && (
                  <div style={{ marginTop: 8 }}>
                    {exportMappingCoverage.loading
                      ? 'Đang kiểm tra coverage mapping xuất Excel…'
                      : exportMappingCoverage.failed
                        ? 'Chưa đọc được coverage mapping xuất Excel.'
                        : `Coverage: ${fields.length} dòng matrix, ${exportMappingCoverage.count} ô mapping trên ${exportMappingCoverage.sheetCount} sheet.`}
                  </div>
                )}
              </div>
            }
          />
        </Space>
      }
      placement="right"
      width={1080}
      onClose={onClose}
      open={open}
    >
      <Spin spinning={loading}>
        <Card size="small" style={{ marginBottom: 16, background: '#F8FAFC', borderRadius: 8, borderColor: '#E2E8F0' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space size="middle">
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Cơ quan đích:</Text>
                  <Tag color={destinationProfile.tagColor} style={{ fontWeight: 600, fontSize: 13 }}>
                    {destinationProfile.label}
                  </Tag>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Định dạng xuất:</Text>
                  <Tag color={isSbv ? 'success' : 'processing'}>
                    {destinationProfile.artifactDescription}
                  </Tag>
                </div>
              </Space>
            </Col>
            <Col>
              <Space align="center" size="middle">
                <div>
                  <Text strong style={{ fontSize: 13, display: 'block' }}>
                    Quy trình Maker - Checker:
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {requireMakerChecker ? 'Bắt buộc Checker duyệt' : 'STP Tự động duyệt & nộp'}
                  </Text>
                </div>
                <Switch
                  checkedChildren="Bắt buộc duyệt"
                  unCheckedChildren="STP Tự động"
                  checked={requireMakerChecker}
                  loading={makerCheckerLoading}
                  onChange={handleToggleMakerChecker}
                  style={{ background: requireMakerChecker ? '#003B95' : '#16A34A' }}
                />
              </Space>
            </Col>
          </Row>
        </Card>

        <Tabs
          defaultActiveKey={isSbv ? 'sbv-excel-template' : 'rules'}
          items={[
            {
              key: 'rules',
              label: (
                <Space>
                  <CheckSquareOutlined />
                  <span>Bộ Quy Tắc Đối Soát Rules ({rules.length})</span>
                </Space>
              ),
              children: (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text strong style={{ fontSize: 14 }}>
                      Danh sách Quy Tắc Đã Thiết Lập ({rules.length}):
                    </Text>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      style={{ background: '#003B95' }}
                      onClick={onOpenAddRule}
                    >
                      Thêm Quy Tắc Mới
                    </Button>
                  </div>

                  <Table
                    dataSource={rules}
                    rowKey="id"
                    pagination={false}
                    columns={[
                      {
                        title: 'Khóa Thực Tế (Actual)',
                        dataIndex: 'actualKey',
                        key: 'actualKey',
                        width: 170,
                        render: (k) => <Text code strong style={{ color: '#003B95' }}>{k}</Text>,
                      },
                      {
                        title: 'Toán Tử',
                        dataIndex: 'operator',
                        key: 'operator',
                        width: 90,
                        render: (op: string) => {
                          const mapColor: Record<string, string> = {
                            EQ: 'green',
                            NE: 'orange',
                            GT: 'blue',
                            GTE: 'blue',
                            LT: 'purple',
                            LTE: 'purple',
                            UNIQUE: 'cyan',
                          };
                          return <Tag color={mapColor[op] || 'default'}>{op}</Tag>;
                        },
                      },
                      {
                        title: 'Khóa Đối Soát (Expected)',
                        dataIndex: 'expectedKey',
                        key: 'expectedKey',
                        width: 190,
                        render: (k) => <Text code>{k}</Text>,
                      },
                      {
                        title: 'Dung Sai',
                        dataIndex: 'tolerance',
                        key: 'tolerance',
                        width: 100,
                        render: (t) => (t ? `${Number(t).toLocaleString()} đ` : '0 đ'),
                      },
                      {
                        title: 'Thông Báo Lỗi',
                        dataIndex: 'message',
                        key: 'message',
                        render: (m) => <Text type="secondary" style={{ fontSize: 12 }}>{m}</Text>,
                      },
                      {
                        title: 'Thao Tác',
                        key: 'actions',
                        width: 90,
                        render: (_, r) => (
                          <Space size="small">
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => onEditRule(r)}
                            />
                            <Popconfirm
                              title="Xác nhận xóa quy tắc này?"
                              onConfirm={() => onDeleteRule(r.id)}
                              okText="Xóa"
                              cancelText="Hủy"
                            >
                              <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                            </Popconfirm>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </div>
              ),
            },
            ...(isSbv
              ? [
                  {
                    key: 'sbv-excel-template',
                    label: (
                      <Space>
                        <FileExcelOutlined style={{ color: '#16A34A' }} />
                        <span>Mẫu Biểu & Mapping Excel NHNN (.xlsx) ({fields.length})</span>
                      </Space>
                    ),
                    children: (
                      <div>
                        <Card
                          title={
                            <Space>
                              <FileExcelOutlined style={{ color: '#16A34A' }} />
                              <span>Thông Tin & Thao Tác Mẫu Biểu SBV: {template?.reportCode}</span>
                            </Space>
                          }
                          size="small"
                          extra={
                            <Space size={4}>
                              <Tooltip title="Tải biểu mẫu">
                                <Button
                                  type="text"
                                  shape="circle"
                                  icon={<FileExcelOutlined />}
                                  aria-label="Tải biểu mẫu"
                                  onClick={() => downloadSbvOfficialExcelTemplate(template?.reportCode || 'B01', template, fields)}
                                />
                              </Tooltip>
                            </Space>
                          }
                          style={{ marginBottom: 16 }}
                        />

                        <Card
                          title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Space>
                                <Text strong style={{ fontSize: 14 }}>
                                  Bảng Ma Trận Dòng Chỉ Tiêu ({fields.length} dòng):
                                </Text>
                              </Space>
                              <Button
                                size="small"
                                type="primary"
                                icon={<PlusOutlined />}
                                style={{ background: '#003B95' }}
                                onClick={handleOpenAddSbvRow}
                              >
                                Thêm Dòng
                              </Button>
                            </div>
                          }
                          size="small"
                        >
                          {fields.length === 0 ? (
                            <div style={{ padding: '28px 16px', textAlign: 'center', background: '#FAFAFA', borderRadius: 8, border: '1px dashed #D9D9D9' }}>
                              <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 56,
                                height: 56,
                                borderRadius: '50%',
                                background: '#EFF6FF',
                                color: '#2563EB',
                                marginBottom: 14,
                              }}>
                                <FileExcelOutlined style={{ fontSize: 28 }} />
                              </div>
                              <Typography.Title level={5} style={{ marginBottom: 6, color: '#1E293B' }}>
                                Chưa Cấu Hình Ma Trận Ánh Xạ Chỉ Tiêu (STTM)
                              </Typography.Title>
                              <Typography.Paragraph type="secondary" style={{ maxWidth: 640, margin: '0 auto 20px', fontSize: 13, lineHeight: 1.6 }}>
                                Biểu mẫu <strong>{template?.reportCode}</strong> — <em>{template?.reportName}</em> đã được khởi tạo theo Thông tư 41/2026/TT-NHNN.
                                Để tránh phát sinh dữ liệu ảo không chuẩn xác, hệ thống chưa nạp trước chỉ tiêu cho đến khi ma trận ánh xạ từ Core Banking / DWH được thống nhất.
                              </Typography.Paragraph>

                              <Row gutter={[16, 16]} style={{ textAlign: 'left', marginBottom: 24, maxWidth: 880, marginLeft: 'auto', marginRight: 'auto' }}>
                                <Col span={8}>
                                  <Card size="small" style={{ height: '100%', borderRadius: 8, borderColor: '#E2E8F0', background: '#FFFFFF', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                      <div><Tag color="blue" style={{ fontWeight: 600 }}>Bước 1: Chuẩn hóa STTM</Tag></div>
                                      <Text strong style={{ fontSize: 13 }}>Xác định nguồn số liệu</Text>
                                      <Text type="secondary" style={{ fontSize: 12 }}>
                                        Xác định tài khoản kế toán, phân hệ hợp đồng, khoản vay từ Core/DWH cần tổng hợp.
                                      </Text>
                                    </div>
                                  </Card>
                                </Col>
                                <Col span={8}>
                                  <Card size="small" style={{ height: '100%', borderRadius: 8, borderColor: '#E2E8F0', background: '#FFFFFF', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                      <div><Tag color="green" style={{ fontWeight: 600 }}>Bước 2: Định nghĩa Chỉ tiêu</Tag></div>
                                      <Text strong style={{ fontSize: 13 }}>Gán vị trí Cột/Ô Excel</Text>
                                      <Text type="secondary" style={{ fontSize: 12 }}>
                                        Thêm dòng mapping chỉ tiêu và gán vị trí ô tính (VD: Cột E, Dư nợ ngắn hạn) trên biểu mẫu.
                                      </Text>
                                    </div>
                                  </Card>
                                </Col>
                                <Col span={8}>
                                  <Card size="small" style={{ height: '100%', borderRadius: 8, borderColor: '#E2E8F0', background: '#FFFFFF', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                      <div><Tag color="purple" style={{ fontWeight: 600 }}>Bước 3: Kết nối Staging</Tag></div>
                                      <Text strong style={{ fontSize: 13 }}>Ánh xạ bảng Staging</Text>
                                      <Text type="secondary" style={{ fontSize: 12 }}>
                                        Liên kết bảng `tempo_sbv_credit_risk` hoặc `tempo_sbv_candotk` để tự động tính toán.
                                      </Text>
                                    </div>
                                  </Card>
                                </Col>
                              </Row>

                              <Space size="middle">
                                <Button
                                  type="primary"
                                  icon={<PlusOutlined />}
                                  style={{ background: '#003B95', borderColor: '#003B95' }}
                                  onClick={handleOpenAddSbvRow}
                                >
                                  + Thêm Dòng Mapping Đầu Tiên
                                </Button>
                                <Button
                                  icon={<DownloadOutlined />}
                                  onClick={() => downloadSbvOfficialExcelTemplate(template?.reportCode || 'SBV', template, fields)}
                                >
                                  Tải Mẫu Biểu Khung Tham Khảo (.xlsx)
                                </Button>
                              </Space>
                            </div>
                          ) : (
                            <Table
                              dataSource={fields}
                              rowKey="id"
                              pagination={{ pageSize: 10 }}
                              size="small"
                              scroll={{ x: 1080 }}
                              columns={[
                                {
                                  title: 'STT',
                                  key: 'stt',
                                  width: 60,
                                  align: 'center',
                                  render: (_, __, idx) => idx + 1,
                                },
                                {
                                  title: 'Số Hiệu TK / Chỉ Tiêu',
                                  dataIndex: 'indicatorCode',
                                  width: 150,
                                  render: (c) => <Text code strong style={{ color: '#003B95', fontSize: 13 }}>{c}</Text>,
                                },
                                {
                                  title: 'Tên Chỉ Tiêu Báo Cáo / Diễn Giải',
                                  dataIndex: 'sourceReference',
                                  width: 280,
                                  render: (s) => (
                                    <div style={{ whiteSpace: 'normal', wordBreak: 'break-word', fontWeight: 500, lineHeight: 1.4 }}>
                                      {s ? s.replace(/ - tempo_.*$/, '') : '-'}
                                    </div>
                                  ),
                                },
                                {
                                  title: 'Vị Trí Cột / Ô Excel',
                                  dataIndex: 'jsonPath',
                                  width: 160,
                                  render: (p) => <Tag color="purple" style={{ fontFamily: 'monospace', fontWeight: 600 }}>{p}</Tag>,
                                },
                                {
                                  title: 'Bảng Nguồn Staging (ETL)',
                                  dataIndex: 'sourceReference',
                                  width: 170,
                                  render: (s) => (
                                    <Tag color="cyan">
                                      {s?.includes('tempo_') ? s.split(' - ')[1] : 'tempo_sbv_credit_risk'}
                                    </Tag>
                                  ),
                                },
                                {
                                  title: 'Kiểu & Độ Dài',
                                  dataIndex: 'dataType',
                                  width: 110,
                                  render: (t, r) => (
                                    <Tag color="blue">
                                      {t === 'N' ? 'Số tiền' : t} ({r.maxLength || 18})
                                    </Tag>
                                  ),
                                },
                                {
                                  title: 'Bắt Buộc',
                                  dataIndex: 'mandatory',
                                  width: 95,
                                  align: 'center',
                                  render: (m) => (m ? <Tag color="red">Bắt buộc</Tag> : <Tag>Tùy chọn</Tag>),
                                },
                                {
                                  title: 'Thao Tác',
                                  key: 'action',
                                  width: 90,
                                  align: 'center',
                                  fixed: 'right',
                                  render: (_, r) => (
                                    <Space size="small">
                                      <Button
                                        type="text"
                                        size="small"
                                        icon={<EditOutlined />}
                                        onClick={() => handleOpenEditSbvRow(r)}
                                        title="Sửa dòng mapping"
                                      />
                                      <Popconfirm
                                        title="Xóa dòng mapping này khỏi mẫu biểu?"
                                        onConfirm={() => onDeleteField(r.id)}
                                        okText="Xóa"
                                        cancelText="Hủy"
                                      >
                                        <Button type="text" danger size="small" icon={<DeleteOutlined />} title="Xóa dòng" />
                                      </Popconfirm>
                                    </Space>
                                  ),
                                },
                              ]}
                            />
                          )}
                        </Card>
                      </div>
                    ),
                  },
                ]
              : [
                  {
                    key: 'fields',
                    label: (
                      <Space>
                        <UnorderedListOutlined />
                        <span>Trường Dữ Liệu Fields ({fields.length})</span>
                      </Space>
                    ),
                    children: (
                      <div>
                        <div style={{ textAlign: 'right', marginBottom: 12 }}>
                          <Button
                            type="primary"
                            size="small"
                            icon={<PlusOutlined />}
                            style={{ background: '#003B95' }}
                            onClick={() => setAddFieldOpen(true)}
                          >
                            Thêm Trường Mới
                          </Button>
                        </div>

                        {addFieldOpen && (
                          <Card size="small" style={{ marginBottom: 16, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                            <Form form={fieldForm} layout="inline">
                              <Form.Item name="indicatorCode" rules={[{ required: true, message: 'Nhập mã chỉ tiêu' }]} style={{ width: 140, marginBottom: 8 }}>
                                <Input placeholder="Mã chỉ tiêu (TK001)" />
                              </Form.Item>
                              <Form.Item name="jsonPath" rules={[{ required: true, message: 'Nhập JSON path' }]} style={{ width: 180, marginBottom: 8 }}>
                                <Input placeholder="JSON Path (TK001)" />
                              </Form.Item>
                              <Form.Item name="dataType" initialValue="C" style={{ width: 95, marginBottom: 8 }}>
                                <Select>
                                  <Select.Option value="C">Chuỗi (C)</Select.Option>
                                  <Select.Option value="N">Số (N)</Select.Option>
                                  <Select.Option value="D">Ngày (D)</Select.Option>
                                </Select>
                              </Form.Item>
                              <Form.Item name="maxLength" initialValue={250} style={{ width: 95, marginBottom: 8 }}>
                                <Input placeholder="Độ dài" type="number" />
                              </Form.Item>
                              <Form.Item name="sourceReference" initialValue={template?.sourceReference || 'QĐ 573 / Phụ lục'} style={{ width: 160, marginBottom: 8 }}>
                                <Input placeholder="Căn cứ quy định" />
                              </Form.Item>
                              <Form.Item name="mandatory" valuePropName="checked" initialValue={true} style={{ marginBottom: 8 }}>
                                <Switch checkedChildren="Bắt buộc" unCheckedChildren="Tùy chọn" />
                              </Form.Item>
                              <Space style={{ marginBottom: 8 }}>
                                <Button type="primary" size="small" style={{ background: '#003B95' }} onClick={handleAddFieldSubmit}>
                                  Lưu
                                </Button>
                                <Button size="small" onClick={() => setAddFieldOpen(false)}>
                                  Hủy
                                </Button>
                              </Space>
                            </Form>
                          </Card>
                        )}

                        <Table
                          dataSource={fields}
                          rowKey="id"
                          pagination={{ pageSize: 10 }}
                          size="small"
                          scroll={{ x: 960 }}
                          columns={[
                            { title: 'Mã Chỉ Tiêu', dataIndex: 'indicatorCode', width: 140, render: (c) => <Text code strong>{c}</Text> },
                            { title: 'JSON Path', dataIndex: 'jsonPath', width: 170, render: (p) => <Text strong>{p}</Text> },
                            { title: 'Kiểu', dataIndex: 'dataType', width: 70, render: (t) => <Tag color="blue">{t}</Tag> },
                            { title: 'Độ Dài', dataIndex: 'maxLength', width: 80, render: (l) => (l ? `${l}` : '-') },
                            { title: 'Bắt Buộc', dataIndex: 'mandatory', width: 90, render: (m) => (m ? <Tag color="red">Bắt buộc</Tag> : <Tag>Tùy chọn</Tag>) },
                            {
                              title: 'Căn Cứ / Nguồn',
                              dataIndex: 'sourceReference',
                              width: 260,
                              render: (s) => (
                                <div style={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.4 }}>
                                  <Text type="secondary" style={{ fontSize: 12 }}>{s || '-'}</Text>
                                </div>
                              ),
                            },
                            {
                              title: '',
                              key: 'action',
                              width: 80,
                              render: (_, r) => (
                                <Space size="small">
                                  {onUpdateField && (
                                    <Button
                                      type="text"
                                      size="small"
                                      icon={<EditOutlined />}
                                      onClick={() => handleOpenEditSbvRow(r)}
                                      title="Chỉnh sửa trường"
                                    />
                                  )}
                                  <Popconfirm title="Xóa dòng này?" onConfirm={() => onDeleteField(r.id)}>
                                    <Button type="text" danger size="small" icon={<DeleteOutlined />} title="Xóa" />
                                  </Popconfirm>
                                </Space>
                              ),
                            },
                          ]}
                        />
                      </div>
                    ),
                  },
                ]),
            {
              key: 'sheets-structure',
              label: (
                <Space>
                  <AppstoreOutlined />
                  <span>{isSbv ? 'Cấu Trúc Sheet Nạp Liệu Nguồn (Input)' : 'Cấu Trúc Sheet Nguồn'} ({sheetConfig?.sheetCount || 1})</span>
                </Space>
              ),
              children: (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text strong style={{ fontSize: 14 }}>
                      Danh Sách Các Sheet Cấu Thành ({sheetConfig?.sheetCount || 0} Sheet):
                    </Text>
                    {template && (
                      <Tooltip title={isSbv ? 'Tải mẫu nạp liệu nguồn' : 'Tải biểu mẫu'}>
                        <Button
                          type="text"
                          shape="circle"
                          icon={<DownloadOutlined />}
                          aria-label={isSbv ? 'Tải mẫu nạp liệu nguồn' : 'Tải biểu mẫu'}
                          onClick={() => downloadMultiSheetExcelTemplate(template.reportCode, template, fields)}
                        />
                      </Tooltip>
                    )}
                  </div>

                  <List
                    grid={{ gutter: 16, column: 2 }}
                    dataSource={sheetConfig?.sheets || []}
                    renderItem={(item, idx) => (
                      <List.Item>
                        <Card size="small" title={<Tag color="geekblue" style={{ fontSize: 13 }}>Sheet #{idx + 1}: {item.sheetName}</Tag>}>
                          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                            {item.description}
                          </Text>
                          <Text strong style={{ fontSize: 12 }}>Các cột trường mẫu ({Object.keys(item.sampleData[0] || {}).length} cột):</Text>
                          <div style={{ marginTop: 6, maxHeight: 90, overflowY: 'auto' }}>
                            <Space wrap size={[4, 4]}>
                              {Object.keys(item.sampleData[0] || {}).map((k) => (
                                <Tag key={k} style={{ fontSize: 11 }}>{k}</Tag>
                              ))}
                            </Space>
                          </div>
                        </Card>
                      </List.Item>
                    )}
                  />
                </div>
              ),
            },
            ...(destinationProfile.supportsJsonSchema
              ? [
                  {
                    key: 'json-schema',
                    label: (
                      <Space>
                        <CodeOutlined />
                        <span>Mẫu JSON Schema (Phụ Lục II)</span>
                      </Space>
                    ),
                    children: (
                      <div>
                        <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
                          <Col>
                            <Text strong>Cấu trúc JSON Mẫu chuẩn theo Phụ lục II QĐ 573:</Text>
                          </Col>
                          <Col>
                            <Space>
                              <Button
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={handleCopyJson}
                              >
                                Sao Chép
                              </Button>
                              <Button
                                size="small"
                                type="primary"
                                icon={<DownloadOutlined />}
                                style={{ background: '#003B95' }}
                                onClick={handleDownloadJson}
                              >
                                Tải JSON
                              </Button>
                            </Space>
                          </Col>
                        </Row>
                        <div
                          style={{
                            background: '#0F172A',
                            color: '#38BDF8',
                            padding: '16px',
                            borderRadius: 8,
                            fontFamily: 'Consolas, Monaco, monospace',
                            fontSize: 12,
                            maxHeight: '520px',
                            overflowY: 'auto',
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {JSON.stringify(generatedDrawerJson, null, 2)}
                        </div>
                      </div>
                    ),
                  },
                ]
              : []),
          ]}
        />
      </Spin>

      {/* Modal Thêm / Chỉnh Sửa Dòng Mapping Cho Biểu Mẫu SBV */}
      <Modal
        title={
          <Space>
            <FileExcelOutlined style={{ color: '#16A34A' }} />
            <span>
              {editingSbvRow
                ? `Chỉnh Sửa Dòng Mapping: ${editingSbvRow.indicatorCode}`
                : `Thêm Dòng Mapping Chỉ Tiêu Biểu Mẫu (${template?.reportCode})`}
            </span>
          </Space>
        }
        open={sbvRowModalOpen}
        onOk={handleSaveSbvRow}
        onCancel={() => {
          setSbvRowModalOpen(false);
          setEditingSbvRow(null);
        }}
        okText="Lưu Dòng Mapping"
        cancelText="Hủy Bỏ"
        confirmLoading={savingRow}
        destroyOnClose
        width={620}
      >
        <Form form={sbvRowForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Mã Chỉ Tiêu / Số Hiệu TK"
                name="indicatorCode"
                rules={[{ required: true, message: 'Vui lòng nhập mã chỉ tiêu hoặc số hiệu tài khoản' }]}
              >
                <Input placeholder="Ví dụ: A1_001_01, 2111, TONG_DU_NO" disabled={!!editingSbvRow} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Vị Trí Cột / Ô Excel Mapping"
                name="jsonPath"
                rules={[{ required: true, message: 'Vui lòng nhập vị trí cột hoặc ô mapping' }]}
              >
                <Input placeholder="Ví dụ: Cột E (Dư nợ ngắn hạn), Ô E7, ROW_07:COL_D_I" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Tên Chỉ Tiêu / Diễn Giải Nghiệp Vụ"
            name="indicatorName"
            rules={[{ required: true, message: 'Vui lòng nhập tên chỉ tiêu' }]}
          >
            <Input placeholder="Ví dụ: Dư nợ cho vay khách hàng ngắn hạn VND" />
          </Form.Item>

          <Form.Item
            label="Bảng Nguồn Staging (ETL) Kết Nối"
            name="stagingTable"
            rules={[{ required: true, message: 'Vui lòng chọn bảng staging' }]}
          >
            <Select
              showSearch
              placeholder="Chọn bảng dữ liệu Staging ETL"
              options={[
                { value: 'tempo_sbv_credit_risk', label: 'tempo_sbv_credit_risk (Rủi ro tín dụng theo TT 41/2026/TT-NHNN)' },
                { value: 'tempo_sbv_candotk', label: 'tempo_sbv_candotk (Cân đối tài khoản kế toán TT 35/2015)' },
                { value: 'tempo_cic_credit_loan', label: 'tempo_cic_credit_loan (Quan hệ tín dụng cá nhân & DN)' },
                { value: 'tempo_cic_contract', label: 'tempo_cic_contract (Hợp đồng tín dụng)' },
                { value: 'tempo_cic_customer', label: 'tempo_cic_customer (Thông tin khách hàng CIF)' },
              ]}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Kiểu Dữ Liệu" name="dataType" initialValue="N">
                <Select>
                  <Select.Option value="N">Số tiền (N)</Select.Option>
                  <Select.Option value="C">Ký tự (C)</Select.Option>
                  <Select.Option value="D">Ngày tháng (D)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Độ Dài Tối Đa" name="maxLength" initialValue={18}>
                <Input type="number" placeholder="18" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Đối Soát Bắt Buộc" name="mandatory" valuePropName="checked" initialValue={true}>
                <Switch checkedChildren="Bắt buộc" unCheckedChildren="Tùy chọn" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Drawer>
  );
};
