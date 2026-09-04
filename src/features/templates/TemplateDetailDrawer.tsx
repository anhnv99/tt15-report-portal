import React, { useState, useMemo } from 'react';
import {
  Drawer,
  Spin,
  Tabs,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Alert,
  Popconfirm,
  Card,
  Form,
  Input,
  Select,
  Switch,
  Row,
  Col,
  List,
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
} from '@ant-design/icons';
import type { ReportTemplate, ReportTemplateField, ReportTemplateRule } from '@/types';
import { generateJsonSample } from './utils/jsonTemplateGenerator';
import { resolveReportSheetConfig, downloadMultiSheetExcelTemplate } from '@/features/imports/utils/multiSheetTemplateGenerator';

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
  onDeleteField,
}) => {
  const [fieldForm] = Form.useForm();
  const [addFieldOpen, setAddFieldOpen] = useState(false);

  const generatedDrawerJson = useMemo(() => {
    if (!fields.length || !template) return {};
    return generateJsonSample(template.reportCode, fields);
  }, [template, fields]);

  // Dynamically resolve input sheet configuration for this template
  const sheetConfig = useMemo(() => {
    if (!template) return null;
    return resolveReportSheetConfig(template.reportCode, template, fields);
  }, [template, fields]);

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
      await onAddField(values);
      setAddFieldOpen(false);
      fieldForm.resetFields();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Drawer
      title={
        <Space>
          <Tag
            color={
              template?.targetDestination === 'PCB'
                ? 'purple'
                : template?.targetDestination === 'SVB' || template?.targetDestination === 'SBV'
                ? 'green'
                : 'blue'
            }
            style={{ fontWeight: 600 }}
          >
            {template?.targetDestination || 'CIC'}
          </Tag>
          <span>
            {template?.reportCode || ''} — {template?.reportName || ''}
          </span>
        </Space>
      }
      placement="right"
      width={980}
      onClose={onClose}
      open={open}
    >
      <Spin spinning={loading}>
        <Tabs
          defaultActiveKey="rules"
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
                  <Alert
                    message="Quy tắc đối soát số học & nghiệp vụ (3-Tier Validation):"
                    description="Hệ thống tự động thực thi các quy tắc này khi tổng hợp dữ liệu. Nếu phát hiện vi phạm có độ lệch vượt dung sai (tolerance), hệ thống sẽ cảnh báo hoặc chặn xuất báo cáo."
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />

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
                    <Card size="small" style={{ marginBottom: 16, background: '#F8FAFC' }}>
                      <Form form={fieldForm} layout="inline">
                        <Form.Item name="indicatorCode" rules={[{ required: true }]} style={{ width: 140 }}>
                          <Input placeholder="Mã chỉ tiêu (CN001)" />
                        </Form.Item>
                        <Form.Item name="jsonPath" rules={[{ required: true }]} style={{ width: 180 }}>
                          <Input placeholder="JSON Path (CANHAN[].CN001)" />
                        </Form.Item>
                        <Form.Item name="dataType" initialValue="C" style={{ width: 90 }}>
                          <Select>
                            <Select.Option value="C">Chuỗi (C)</Select.Option>
                            <Select.Option value="N">Số (N)</Select.Option>
                            <Select.Option value="D">Ngày (D)</Select.Option>
                          </Select>
                        </Form.Item>
                        <Form.Item name="mandatory" valuePropName="checked" initialValue={true}>
                          <Switch checkedChildren="Bắt buộc" unCheckedChildren="Tùy chọn" />
                        </Form.Item>
                        <Space>
                          <Button type="primary" size="small" onClick={handleAddFieldSubmit}>
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
                    columns={[
                      { title: 'Mã Chỉ Tiêu', dataIndex: 'indicatorCode', width: 130, render: (c) => <Text code>{c}</Text> },
                      { title: 'JSON Path', dataIndex: 'jsonPath', render: (p) => <Text strong>{p}</Text> },
                      { title: 'Kiểu', dataIndex: 'dataType', width: 70, render: (t) => <Tag color="blue">{t}</Tag> },
                      { title: 'Bắt Buộc', dataIndex: 'mandatory', width: 100, render: (m) => (m ? <Tag color="red">Bắt buộc</Tag> : <Tag>Tùy chọn</Tag>) },
                      {
                        title: '',
                        key: 'del',
                        width: 50,
                        render: (_, r) => (
                          <Popconfirm title="Xóa trường?" onConfirm={() => onDeleteField(r.id)}>
                            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                          </Popconfirm>
                        ),
                      },
                    ]}
                  />
                </div>
              ),
            },
            {
              key: 'sheets-structure',
              label: (
                <Space>
                  <AppstoreOutlined />
                  <span>Cấu Trúc Sheet Nguồn ({sheetConfig?.sheetCount || 1})</span>
                </Space>
              ),
              children: (
                <div>
                  <Alert
                    type="info"
                    showIcon
                    icon={<FileExcelOutlined style={{ color: '#10B981' }} />}
                    message="Cấu trúc Sheet tự động nhận diện theo danh mục trường & cấu hình JSON:"
                    description="Khi tạo mới bất kỳ biểu mẫu nào (kể cả D99 sau này), hệ thống tự động suy luận danh sách các Sheet nguồn cần nạp và sinh tệp Excel tương ứng cho Maker/BI."
                    style={{ marginBottom: 16 }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text strong style={{ fontSize: 14 }}>
                      Danh Sách Các Sheet Cấu Thành ({sheetConfig?.sheetCount || 0} Sheet):
                    </Text>
                    {template && (
                      <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        style={{ background: '#16A34A', borderColor: '#16A34A' }}
                        onClick={() => downloadMultiSheetExcelTemplate(template.reportCode, template, fields)}
                      >
                        Tải Thử File Excel Mẫu ({sheetConfig?.sheetCount} Sheets)
                      </Button>
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
          ]}
        />
      </Spin>
    </Drawer>
  );
};
