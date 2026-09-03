import React, { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Select,
  Input,
  Alert,
  Spin,
  message,
} from 'antd';
import {
  CodeOutlined,
  CopyOutlined,
  DownloadOutlined,
  FileTextOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { ReportTemplate, ReportTemplateField } from '@/types';
import { generateJsonSample } from './utils/jsonTemplateGenerator';

const { Text } = Typography;

interface TemplateJsonPreviewProps {
  templates: ReportTemplate[];
  selectedCode: string;
  fields: ReportTemplateField[];
  loading: boolean;
  onSelectCode: (code: string) => void;
  onOpenDetail: (tpl: ReportTemplate) => void;
}

export const TemplateJsonPreview: React.FC<TemplateJsonPreviewProps> = ({
  templates,
  selectedCode,
  fields,
  loading,
  onSelectCode,
  onOpenDetail,
}) => {
  const [searchText, setSearchText] = useState('');

  const activeTemplate = useMemo(() => {
    return templates.find((t) => t.reportCode === selectedCode);
  }, [templates, selectedCode]);

  const generatedJson = useMemo(() => {
    if (!fields.length) return {};
    return generateJsonSample(selectedCode, fields);
  }, [selectedCode, fields]);

  const filteredFields = useMemo(() => {
    if (!searchText) return fields;
    const q = searchText.toLowerCase();
    return fields.filter(
      (f) =>
        f.indicatorCode.toLowerCase().includes(q) ||
        f.jsonPath.toLowerCase().includes(q)
    );
  }, [fields, searchText]);

  const handleCopyJson = () => {
    const text = JSON.stringify(generatedJson, null, 2);
    navigator.clipboard.writeText(text);
    message.success('Đã sao chép cấu trúc JSON mẫu vào clipboard!');
  };

  const handleDownloadJson = () => {
    const text = JSON.stringify(generatedJson, null, 2);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mau_${selectedCode}_QD573_PL2.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success(`Đã tải xuống tệp Mau_${selectedCode}_QD573_PL2.json`);
  };

  return (
    <div>
      {/* Selector Toolbar */}
      <Card size="small" style={{ marginBottom: 16, borderRadius: 8, background: '#F8FAFC' }}>
        <Row align="middle" justify="space-between" gutter={[16, 16]}>
          <Col xs={24} md={14}>
            <Space align="center" wrap>
              <Text strong style={{ fontSize: 14 }}>
                Chọn Biểu Mẫu Cần Đối Chiếu:
              </Text>
              <Select
                value={selectedCode}
                onChange={onSelectCode}
                style={{ width: 360 }}
                showSearch
                optionFilterProp="children"
              >
                {templates.map((t) => (
                  <Select.Option key={t.reportCode} value={t.reportCode}>
                    <Text strong style={{ color: '#003B95' }}>[{t.reportCode}]</Text> Mẫu {t.templateNumber} - {t.reportName}
                  </Select.Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col xs={24} md={10} style={{ textAlign: 'right' }}>
            <Space>
              <Button icon={<CopyOutlined />} onClick={handleCopyJson}>
                Sao Chép JSON
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                style={{ background: '#003B95' }}
                onClick={handleDownloadJson}
              >
                Tải JSON
              </Button>
              <Button
                icon={<SettingOutlined />}
                onClick={() => activeTemplate && onOpenDetail(activeTemplate)}
              >
                Chỉnh Sửa Rules
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Main Dual-View Panel */}
      <Spin spinning={loading}>
        <Row gutter={16}>
          {/* Left Column: Formatted JSON Preview */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <CodeOutlined style={{ color: '#003B95' }} />
                  <span>Cấu Trúc JSON Chuẩn Phụ Lục II (Mẫu {activeTemplate?.templateNumber} - {selectedCode})</span>
                </Space>
              }
              style={{ borderRadius: 8, height: '100%' }}
              bodyStyle={{ padding: 12 }}
            >
              <Alert
                type="info"
                showIcon
                message="Quy cách đóng gói JSON theo QĐ 573 / TT15:"
                description="Cấu trúc bên dưới được sinh chuẩn hoá từ cây phân cấp (rootStructure) và danh mục chỉ tiêu Phụ lục I. Nghiệp vụ có thể copy để đối chiếu với tài liệu quy cách kỹ thuật."
                style={{ marginBottom: 12 }}
              />
              <div
                style={{
                  background: '#0F172A',
                  color: '#38BDF8',
                  padding: '16px',
                  borderRadius: 8,
                  fontFamily: 'Consolas, Monaco, monospace',
                  fontSize: 12,
                  maxHeight: '620px',
                  overflowY: 'auto',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {JSON.stringify(generatedJson, null, 2)}
              </div>
            </Card>
          </Col>

          {/* Right Column: Appendix I Fields Table */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Row justify="space-between" align="middle" style={{ width: '100%' }}>
                  <Col>
                    <Space>
                      <FileTextOutlined style={{ color: '#003B95' }} />
                      <span>Danh Mục Chỉ Tiêu Phụ Lục I ({fields.length} trường)</span>
                    </Space>
                  </Col>
                  <Col>
                    <Input
                      placeholder="Tìm mã hoặc path..."
                      prefix={<SearchOutlined />}
                      size="small"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      allowClear
                      style={{ width: 180 }}
                    />
                  </Col>
                </Row>
              }
              style={{ borderRadius: 8, height: '100%' }}
              bodyStyle={{ padding: 12 }}
            >
              <Table
                dataSource={filteredFields}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 12, size: 'small' }}
                columns={[
                  {
                    title: 'Mã Chỉ Tiêu',
                    dataIndex: 'indicatorCode',
                    key: 'indicatorCode',
                    width: 100,
                    render: (c) => <Text code strong style={{ color: '#003B95' }}>{c}</Text>,
                  },
                  {
                    title: 'JSON Path Phân Cấp',
                    dataIndex: 'jsonPath',
                    key: 'jsonPath',
                    render: (p) => <Text style={{ fontSize: 12 }}>{p}</Text>,
                  },
                  {
                    title: 'Kiểu',
                    dataIndex: 'dataType',
                    key: 'dataType',
                    width: 70,
                    render: (t) => {
                      const c = t === 'N' ? 'green' : t === 'D' ? 'purple' : 'blue';
                      return <Tag color={c}>{t}</Tag>;
                    },
                  },
                  {
                    title: 'Độ Dài',
                    dataIndex: 'maxLength',
                    key: 'maxLength',
                    width: 70,
                    render: (l) => l || '-',
                  },
                  {
                    title: 'Bắt Buộc',
                    dataIndex: 'mandatory',
                    key: 'mandatory',
                    width: 95,
                    render: (m) => (m ? <Tag color="error">Bắt buộc</Tag> : <Tag>Tùy chọn</Tag>),
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};
