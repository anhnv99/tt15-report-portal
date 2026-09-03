import React, { useState } from 'react';
import {
  Modal,
  Upload,
  Button,
  Space,
  Typography,
  Alert,
  Card,
  Row,
  Col,
  Tag,
  message,
  Divider,
} from 'antd';
import {
  CloudUploadOutlined,
  DownloadOutlined,
  InboxOutlined,
  PlusCircleOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import type { ImportBatch } from '@/types';
import { importApi } from '@/api/import.api';
import { downloadMultiSheetExcelTemplate } from './utils/multiSheetTemplateGenerator';

const { Text, Paragraph, Title } = Typography;
const { Dragger } = Upload;

interface SupplementBatchModalProps {
  open: boolean;
  batch: ImportBatch | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const SupplementBatchModal: React.FC<SupplementBatchModalProps> = ({
  open,
  batch,
  onClose,
  onSuccess,
}) => {
  const [fileList, setFileList] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  if (!batch) return null;

  const handleDownloadSample = () => {
    downloadMultiSheetExcelTemplate(batch.importType || 'D99');
  };

  const handleSupplement = async () => {
    if (fileList.length === 0) {
      message.warning('Vui lòng chọn tệp Excel/CSV chứa dữ liệu bổ sung');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('file', fileList[0].originFileObj || fileList[0]);

      await importApi.supplementImportBatch(batch.id, formData);
      message.success(`Đã bổ sung dữ liệu thành công vào lô ${batch.batchCode || batch.id}`);
      setFileList([]);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      message.error(err?.response?.data?.message || 'Không thể bổ sung dữ liệu vào lô');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <PlusCircleOutlined style={{ color: '#003B95', fontSize: 18 }} />
          <span>Bổ Sung Dữ Liệu Vào Lô ETL #{batch.batchCode || batch.id.substring(0, 8).toUpperCase()}</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={680}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={submitting}>
          Đóng
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<PlusCircleOutlined />}
          loading={submitting}
          style={{ background: '#003B95' }}
          onClick={handleSupplement}
        >
          Nạp Bổ Sung Dữ Liệu
        </Button>,
      ]}
    >
      <Alert
        type="info"
        showIcon
        message="Bổ sung dữ liệu cho quy trình tổng hợp báo cáo"
        description="Dùng trong trường hợp ETL tự động từ hệ thống Core/DWH chưa đầy đủ dữ liệu. Các bản ghi bổ sung sẽ được nạp tiếp nối vào lô này để tiếp tục quy trình kiểm soát và tổng hợp báo cáo."
        style={{ marginBottom: 16 }}
      />

      <Card size="small" style={{ marginBottom: 16, background: '#F8FAFC' }}>
        <Row gutter={[16, 8]}>
          <Col span={12}>
            <Text type="secondary">Loại Biểu Mẫu: </Text>
            <Tag color="blue" style={{ fontWeight: 600 }}>{batch.importType}</Tag>
          </Col>
          <Col span={12}>
            <Text type="secondary">Trạng Thái Hiện Tại: </Text>
            <Tag color="geekblue">{batch.status}</Tag>
          </Col>
          <Col span={12}>
            <Text type="secondary">Tệp Gốc Ban Đầu: </Text>
            <Text strong>{batch.originalFileName || batch.fileName || '-'}</Text>
          </Col>
          <Col span={12}>
            <Text type="secondary">Số Dòng Hiện Tại: </Text>
            <Text strong style={{ color: '#10B981' }}>{batch.totalRows || 0} dòng</Text>
          </Col>
        </Row>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text strong style={{ fontSize: 13 }}>
          Tải Tệp Dữ Liệu Bổ Sung (Excel Đa Sheet hoặc CSV):
        </Text>
        <Button
          type="link"
          size="small"
          icon={<DownloadOutlined />}
          onClick={handleDownloadSample}
        >
          Tải mẫu chuẩn ({batch.importType})
        </Button>
      </div>

      <Dragger
        fileList={fileList}
        maxCount={1}
        beforeUpload={(file) => {
          setFileList([file]);
          return false;
        }}
        onRemove={() => setFileList([])}
        accept=".xlsx,.xls,.csv"
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined style={{ color: '#003B95' }} />
        </p>
        <p className="ant-upload-text">Nhấp hoặc kéo thả tệp dữ liệu bổ sung vào đây</p>
        <p className="ant-upload-hint">
          Hỗ trợ tệp Excel (.xlsx) đa sheet hoặc CSV. Các dòng mới sẽ được nối tiếp vào lô dữ liệu.
        </p>
      </Dragger>
    </Modal>
  );
};
