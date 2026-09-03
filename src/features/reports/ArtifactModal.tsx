import React from 'react';
import { Modal, Button, Table, Tag, Space, Typography, Descriptions, Spin } from 'antd';
import { DownloadOutlined, FileZipOutlined, PlayCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { CicReportVersion, ReportArtifact } from '@/types';
import { reportingApi } from '@/api/reporting.api';
import { getStandardReportFileName } from '@/utils/reportFileNameHelper';

const { Text } = Typography;

interface ArtifactModalProps {
  open: boolean;
  version: CicReportVersion | null;
  artifacts: ReportArtifact[];
  loading: boolean;
  generating: boolean;
  onCancel: () => void;
  onGenerate: () => Promise<void>;
}

export const ArtifactModal: React.FC<ArtifactModalProps> = ({
  open,
  version,
  artifacts,
  loading,
  generating,
  onCancel,
  onGenerate,
}) => {
  const handleDownloadArtifact = async (artifact: ReportArtifact) => {
    try {
      const res: any = await reportingApi.downloadArtifact(artifact.id);
      const mimeMap: Record<string, string> = {
        JSON: 'application/json',
        ZIP: 'application/zip',
        XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
      const mimeType = mimeMap[artifact.fileType ?? ''] || 'application/octet-stream';
      const blob = res instanceof Blob ? res : new Blob([res.data || res], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = artifact.fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const columns: ColumnsType<ReportArtifact> = [
    {
      title: 'Tên Tệp Đóng Gói',
      dataIndex: 'fileName',
      key: 'fileName',
      render: (f) => (
        <Space>
          <FileZipOutlined style={{ color: '#003B95' }} />
          <Text strong>{f}</Text>
        </Space>
      ),
    },
    {
      title: 'Định Dạng',
      dataIndex: 'fileType',
      key: 'fileType',
      width: 110,
      render: (t) => <Tag color="blue">{t}</Tag>,
    },
    {
      title: 'Dung Lượng',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: 120,
      render: (s) => (s ? `${(s / 1024).toFixed(1)} KB` : '-'),
    },
    {
      title: 'Mã Băm SHA-256',
      dataIndex: 'checksumSha256',
      key: 'checksumSha256',
      render: (c) => (c ? <Text code style={{ fontSize: 11 }}>{c.substring(0, 16)}...</Text> : '-'),
    },
    {
      title: 'Tải Về',
      key: 'actions',
      width: 130,
      render: (_, r) => (
        <Button
          type="primary"
          size="small"
          icon={<DownloadOutlined />}
          style={{ background: '#003B95' }}
          onClick={() => handleDownloadArtifact(r)}
        >
          Tải {r.fileType}
        </Button>
      ),
    },
  ];

  return (
    <Modal
      title={
        <span>
          <FileZipOutlined style={{ marginRight: 8, color: '#003B95' }} />
          Tệp Đóng Gói Báo Cáo CIC / SBV (Artifacts)
        </span>
      }
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="close" onClick={onCancel}>
          Đóng
        </Button>,
        <Button
          key="gen"
          type="primary"
          icon={<PlayCircleOutlined />}
          style={{ background: '#003B95' }}
          loading={generating}
          onClick={onGenerate}
        >
          Sinh Lại Tệp Đóng Gói
        </Button>,
      ]}
      width={750}
    >
      <Spin spinning={loading}>
        {version && (
          <Descriptions size="small" column={2} style={{ margin: '16px 0' }} bordered>
            <Descriptions.Item label="Mã Phiên Bản">
              <Text strong style={{ color: '#003B95' }}>v{version.versionNumber}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng Thái">
              <Tag color="green">{version.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Tên Tệp Đăng Ký (QĐ573)">
              <Text code copyable>
                {version.fileName || getStandardReportFileName(version.reportCode, version.reportingDate, version.versionNumber, '79301001', 'json')}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày Báo Cáo">
              {version.reportingDate}
            </Descriptions.Item>
          </Descriptions>
        )}

        <Table
          columns={columns}
          dataSource={artifacts}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Spin>
    </Modal>
  );
};
