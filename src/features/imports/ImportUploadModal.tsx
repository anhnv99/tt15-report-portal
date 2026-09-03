import React, { useState, useMemo } from 'react';
import {
  Modal,
  Form,
  Select,
  Upload,
  Typography,
  message,
  Space,
  Button,
  Row,
  Col,
  Radio,
  Card,
  Tag,
} from 'antd';
import {
  InboxOutlined,
  CloudUploadOutlined,
  DownloadOutlined,
  AppstoreOutlined,
  TableOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { ReportTemplate, DataPeriod } from '@/types';
import { downloadSampleImportFile } from './utils/excelTemplateGenerator';
import {
  downloadMultiSheetExcelTemplate,
  getReportSheetConfig,
  type ReportSheetConfig,
} from './utils/multiSheetTemplateGenerator';

const { Text } = Typography;
const { Dragger } = Upload;

interface ImportUploadModalProps {
  open: boolean;
  templates: ReportTemplate[];
  periods: DataPeriod[];
  uploadType: string;
  uploadPeriodId?: number;
  fileList: UploadFile[];
  uploading: boolean;
  onCancel: () => void;
  onTypeChange: (val: string) => void;
  onPeriodChange: (val: number) => void;
  onFileListChange: (files: UploadFile[]) => void;
  onSubmit: () => Promise<void>;
}

export const ImportUploadModal: React.FC<ImportUploadModalProps> = ({
  open,
  templates,
  periods,
  uploadType,
  uploadPeriodId,
  fileList,
  uploading,
  onCancel,
  onTypeChange,
  onPeriodChange,
  onFileListChange,
  onSubmit,
}) => {
  const [importFormat, setImportFormat] = useState<'MULTI_SHEET' | 'FLAT'>('MULTI_SHEET');

  const selectedTemplate = useMemo(() => {
    return templates.find((t) => t.reportCode === uploadType);
  }, [templates, uploadType]);

  const sheetConfig: ReportSheetConfig = useMemo(() => {
    return getReportSheetConfig(uploadType, selectedTemplate);
  }, [uploadType, selectedTemplate]);

  const handleDownloadTemplate = () => {
    if (importFormat === 'MULTI_SHEET') {
      downloadMultiSheetExcelTemplate(uploadType);
    } else {
      downloadSampleImportFile(uploadType);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <CloudUploadOutlined style={{ color: '#003B95' }} />
          <span>Tải Lên Tệp Dữ Liệu Nguồn (Import / ETL Staging)</span>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      onOk={onSubmit}
      confirmLoading={uploading}
      okText="Bắt Đầu Tải Lên"
      cancelText="Hủy"
      width={780}
    >
      <div style={{ marginTop: 12 }}>
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item label="Biểu Mẫu Báo Cáo Áp Dụng" required>
                <Select value={uploadType} onChange={onTypeChange} showSearch optionFilterProp="children">
                  {templates.map((t) => (
                    <Select.Option key={t.reportCode} value={t.reportCode}>
                      <Text strong style={{ color: '#003B95' }}>[{t.reportCode}]</Text> Mẫu {t.templateNumber} - {t.reportName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item label="Kỳ Dữ Liệu Báo Cáo" required>
                <Select
                  value={uploadPeriodId}
                  onChange={onPeriodChange}
                  placeholder="Chọn kỳ dữ liệu"
                  showSearch
                  optionFilterProp="children"
                >
                  {periods.map((p) => (
                    <Select.Option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Dynamic Template Format Selector & Download Banner */}
          <Card size="small" style={{ marginBottom: 16, background: '#F0FDF4', borderColor: '#BBF7D0', borderRadius: 8 }}>
            <Row justify="space-between" align="middle" gutter={[16, 16]}>
              <Col xs={24} md={15}>
                <div style={{ marginBottom: 6 }}>
                  <Text strong style={{ color: '#166534', fontSize: 13 }}>
                    Cấu trúc tệp mẫu chuẩn ({uploadType}):
                  </Text>{' '}
                  <Tag color="green">{sheetConfig.sheetCount} Sheet{sheetConfig.sheetCount > 1 ? 's' : ''}</Tag>
                </div>
                <Radio.Group
                  value={importFormat}
                  onChange={(e) => setImportFormat(e.target.value)}
                  size="small"
                >
                  <Radio.Button value="MULTI_SHEET">
                    <Space>
                      <AppstoreOutlined />
                      <span>Mẫu Excel Đa Sheet ({sheetConfig.sheetCount} Sheets)</span>
                    </Space>
                  </Radio.Button>
                  <Radio.Button value="FLAT">
                    <Space>
                      <TableOutlined />
                      <span>Bảng Phẳng Đơn (CSV/DWH)</span>
                    </Space>
                  </Radio.Button>
                </Radio.Group>

                {importFormat === 'MULTI_SHEET' && (
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12, marginRight: 4 }}>
                      Các Sheet cấu thành:
                    </Text>
                    <Space size={[4, 4]} wrap>
                      {sheetConfig.sheets.map((s) => (
                        <Tag key={s.sheetName} color="geekblue" style={{ fontSize: 11, fontWeight: 500 }}>
                          {s.sheetName}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                )}
              </Col>
              <Col xs={24} md={9} style={{ textAlign: 'right' }}>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  style={{ background: '#16A34A', borderColor: '#16A34A' }}
                  onClick={handleDownloadTemplate}
                >
                  {importFormat === 'MULTI_SHEET'
                    ? `Tải Excel ${uploadType} (${sheetConfig.sheetCount} Sheets)`
                    : `Tải CSV Phẳng [${uploadType}]`}
                </Button>
              </Col>
            </Row>
          </Card>

          <Form.Item
            label={`Tệp Tin Nguồn cho [${uploadType}] (Hỗ trợ file Excel .xlsx, .xls, .csv, .json)`}
            required
          >
            <Dragger
              fileList={fileList}
              beforeUpload={(file) => {
                onFileListChange([file]);
                return false;
              }}
              onRemove={() => onFileListChange([])}
              maxCount={1}
              accept=".xlsx,.xls,.csv,.json"
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ color: '#003B95' }} />
              </p>
              <p className="ant-upload-text">Nhấp hoặc kéo thả tệp tin vào khu vực này để tải lên</p>
              <p className="ant-upload-hint">
                Hệ thống tự động nhận diện các Sheet cấu thành (
                <b style={{ color: '#003B95' }}>{sheetConfig.sheets.map((s) => s.sheetName).join(', ')}</b>
                ) hoặc bảng phẳng, tự động map khóa liên kết và đưa vào hàng đợi Staging.
              </p>
            </Dragger>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};
