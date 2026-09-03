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
  Input,
  message,
  Divider,
} from 'antd';
import {
  DownloadOutlined,
  InboxOutlined,
  EditOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { CicReportVersion, ReportArtifact } from '@/types';
import { reportingApi } from '@/api/reporting.api';
import { downloadMultiSheetExcelTemplate } from '@/features/imports/utils/multiSheetTemplateGenerator';

const { Text, Paragraph } = Typography;
const { Dragger } = Upload;
const { TextArea } = Input;

interface ReportAdjustmentModalProps {
  open: boolean;
  version: CicReportVersion | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReportAdjustmentModal: React.FC<ReportAdjustmentModalProps> = ({
  open,
  version,
  onClose,
  onSuccess,
}) => {
  const [fileList, setFileList] = useState<any[]>([]);
  const [reason, setReason] = useState<string>('');
  const [downloading, setDownloading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!version) return null;

  const handleDownloadCurrentExcel = async () => {
    try {
      setDownloading(true);
      message.loading({ content: 'Đang chuẩn bị tệp Excel đa sheet...', key: 'dl_adjust' });
      const artifacts: ReportArtifact[] = await reportingApi.getArtifactsByVersionId(version.id);
      const xlsx = (artifacts || []).find((a) => a.fileType === 'XLSX');

      if (xlsx && xlsx.id) {
        const res: any = await reportingApi.downloadArtifact(xlsx.id);
        const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        const blob = res instanceof Blob ? res : new Blob([res.data || res], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = xlsx.fileName || `${version.reportCode}_v${version.versionNumber}_adjustment.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
        message.success({ content: `Đã tải xuống ${xlsx.fileName}`, key: 'dl_adjust' });
      } else {
        // Fallback to template if artifacts not yet generated
        await downloadMultiSheetExcelTemplate(version.reportCode);
        message.info({ content: 'Đã tải tệp Excel mẫu đa sheet theo cấu trúc chuẩn', key: 'dl_adjust' });
      }
    } catch (err) {
      console.error(err);
      message.error({ content: 'Không thể tải tệp Excel báo cáo', key: 'dl_adjust' });
    } finally {
      setDownloading(false);
    }
  };

  const handleAdjustSubmit = async () => {
    if (fileList.length === 0) {
      message.warning('Vui lòng chọn tệp Excel đã điều chỉnh');
      return;
    }
    if (!reason.trim()) {
      message.warning('Vui lòng nhập lý do / căn cứ giải trình điều chỉnh số liệu');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('file', fileList[0].originFileObj || fileList[0]);
      formData.append('reason', reason.trim());
      formData.append('adjustedBy', 'Maker');

      const newVersion = await reportingApi.adjustReportVersion(version.id, formData);
      message.success(
        `Đã tạo phiên bản mới v${newVersion.versionNumber || version.versionNumber + 1} thành công với số liệu điều chỉnh!`
      );
      setFileList([]);
      setReason('');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      message.error(err?.response?.data?.message || 'Không thể cập nhật điều chỉnh báo cáo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <EditOutlined style={{ color: '#003B95', fontSize: 18 }} />
          <span>
            Điều Chỉnh Số Liệu Báo Cáo Cuối: {version.reportCode} (Phiên bản v{version.versionNumber})
          </span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={720}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={submitting}>
          Hủy Bỏ
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<CheckCircleOutlined />}
          loading={submitting}
          style={{ background: '#003B95' }}
          onClick={handleAdjustSubmit}
        >
          Lưu Điều Chỉnh & Sinh Phiên Bản Mới
        </Button>,
      ]}
    >
      <Alert
        type="info"
        showIcon
        message="Quy trình điều chỉnh số liệu báo cáo cuối (QĐ 573 / TT15)"
        description="Dùng trong trường hợp đã tổng hợp thành version báo cáo mà nghiệp vụ muốn sửa 1 vài tiêu chí. Tệp Excel tải về được tách thành các Sheet độc lập (Khách hàng, Hợp đồng, Khoản vay/Khế ước...). Sau khi sửa xong, tải file lên tại đây để hệ thống tự động tái lập cây JSON, sinh phiên bản mới và tính lại mã băm SHA-256."
        style={{ marginBottom: 16 }}
      />

      <Card size="small" style={{ marginBottom: 16, background: '#F8FAFC' }}>
        <Row gutter={[16, 8]}>
          <Col span={12}>
            <Text type="secondary">Biểu Mẫu Báo Cáo: </Text>
            <Tag color="blue" style={{ fontWeight: 600 }}>{version.reportCode}</Tag>
          </Col>
          <Col span={12}>
            <Text type="secondary">Phiên Bản Gốc: </Text>
            <Tag color="geekblue">v{version.versionNumber} ({version.status})</Tag>
          </Col>
          <Col span={12}>
            <Text type="secondary">Ngày Lập Báo Cáo: </Text>
            <Text strong>{version.reportingDate ? new Date(version.reportingDate).toLocaleDateString('vi-VN') : '-'}</Text>
          </Col>
          <Col span={12}>
            <Text type="secondary">Người Lập: </Text>
            <Text strong>{version.submittedBy || 'Hệ thống tự động'}</Text>
          </Col>
        </Row>
      </Card>

      {/* Bước 1 */}
      <div style={{ marginBottom: 16, padding: '12px 16px', background: '#F0F7FF', borderRadius: 6, border: '1px solid #BAE0FF' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text strong style={{ color: '#002B66', fontSize: 13 }}>
              Bước 1: Tải tệp Excel đa sheet của báo cáo hiện tại
            </Text>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
              Tệp Excel đã bóc tách dữ liệu theo các sheet nghiệp vụ kèm khóa liên kết.
            </div>
          </div>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            loading={downloading}
            style={{ background: '#003B95' }}
            onClick={handleDownloadCurrentExcel}
          >
            Tải Excel Báo Cáo
          </Button>
        </div>
      </div>

      {/* Bước 2 */}
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
          Bước 2: Tải lên tệp Excel đã điều chỉnh số liệu & Căn cứ giải trình
        </Text>

        <div style={{ marginBottom: 12 }}>
          <Dragger
            fileList={fileList}
            maxCount={1}
            beforeUpload={(file) => {
              setFileList([file]);
              return false;
            }}
            onRemove={() => setFileList([])}
            accept=".xlsx,.xls"
          >
            <p className="ant-upload-drag-icon">
              <FileExcelOutlined style={{ color: '#10B981', fontSize: 28 }} />
            </p>
            <p className="ant-upload-text">Nhấp hoặc kéo thả tệp Excel (.xlsx) đã sửa vào đây</p>
            <p className="ant-upload-hint">
              Hệ thống sẽ đọc các sheet nghiệp vụ và tự động ghép nối (assemble) lại cây JSON chuẩn.
            </p>
          </Dragger>
        </div>

        <div>
          <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            Lý do điều chỉnh / Căn cứ giải trình <span style={{ color: '#EF4444' }}>*</span>:
          </Text>
          <TextArea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: Đính chính số dư nợ khoản vay KU-01 theo biên bản đối soát số 12/BB-KT..."
          />
        </div>
      </div>
    </Modal>
  );
};
