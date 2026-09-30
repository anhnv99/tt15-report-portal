import React, { useState } from 'react';
import { Alert, Modal, Button, Table, Tag, Space, Typography, Descriptions, Spin, message } from 'antd';
import { DownloadOutlined, FileZipOutlined, PlayCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { CicReportVersion, ReportArtifact } from '@/types';
import { reportingApi } from '@/api/reporting.api';
import { getStandardReportFileName } from '@/utils/reportFileNameHelper';
import { getReportDestinationProfile } from '@/features/reporting-destinations/profiles';
import { getVersionDestinationProfile } from '@/features/reporting-destinations/resolveReportDestination';

const { Text } = Typography;

type ExportReadiness = {
  ready: boolean;
  mappingCount: number;
  snapshotCellCount: number;
  missingMappedValues: Array<{ sheetCode: string; lineCode: string; columnCode: string }>;
  unmappedSnapshotCells: Array<{ sheetCode: string; lineCode: string; columnCode: string }>;
};

interface ArtifactModalProps {
  open: boolean;
  version: CicReportVersion | null;
  artifacts: ReportArtifact[];
  loading: boolean;
  generating: boolean;
  onCancel: () => void;
  onGenerate: () => Promise<void>;
  onExportAdjusted: () => Promise<void>;
}

export const ArtifactModal: React.FC<ArtifactModalProps> = ({
  open,
  version,
  artifacts,
  loading,
  generating,
  onCancel,
  onGenerate,
  onExportAdjusted,
}) => {
  const profile = version ? getVersionDestinationProfile(version) : getReportDestinationProfile('CIC');
  const supportsWorkbookAdjustment = profile.supportsWorkbookAdjustment;
  const [exportReadiness, setExportReadiness] = useState<ExportReadiness | null>(null);
  const [readinessVersionId, setReadinessVersionId] = useState<string | null>(null);

  const checkExportReadiness = async () => {
    if (!version) return;
    try {
      const readiness = await reportingApi.getAdjustedSbvExportReadiness(version.id);
      setExportReadiness(readiness);
      setReadinessVersionId(version.id);
      message[readiness.ready ? 'success' : 'warning'](readiness.ready
        ? 'Version đã sẵn sàng xuất SBV.'
        : 'Version chưa sẵn sàng xuất. Kiểm tra các ô thiếu bên dưới.');
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không kiểm tra được điều kiện xuất SBV');
    }
  };
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
          {`Tệp Đóng Gói Báo Cáo ${profile.label}`}
        </span>
      }
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="close" onClick={onCancel}>
          Đóng
        </Button>,
        ...(supportsWorkbookAdjustment ? [
          <Button key="check-export-readiness" onClick={checkExportReadiness}>
            Kiểm tra trước khi xuất
          </Button>,
          <Button
            key="export-adjusted"
            icon={<DownloadOutlined />}
            loading={generating}
            onClick={onExportAdjusted}
          >
            Xuất version điều chỉnh SBV
          </Button>,
        ] : []),
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
            <Descriptions.Item label={`Tên tệp báo cáo ${profile.label}`}>
              <Text code copyable>
                {version.fileName || getStandardReportFileName(version.reportCode, version.reportingDate, version.versionNumber, '79301001', profile.defaultArtifactExtension)}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày Báo Cáo">
              {version.reportingDate}
            </Descriptions.Item>
          </Descriptions>
        )}

        {supportsWorkbookAdjustment && exportReadiness && readinessVersionId === version?.id && (
          <Alert
            showIcon
            style={{ marginBottom: 16 }}
            type={exportReadiness.ready ? 'success' : 'warning'}
            message={exportReadiness.ready ? 'Đủ điều kiện export SBV' : 'Chưa đủ điều kiện export SBV'}
            description={exportReadiness.ready
              ? `${exportReadiness.mappingCount} mapping khớp ${exportReadiness.snapshotCellCount} ô snapshot.`
              : <>Có {exportReadiness.mappingCount} mapping; thiếu giá trị ở {exportReadiness.missingMappedValues.length} ô mapping và có {exportReadiness.unmappedSnapshotCells.length} ô snapshot chưa mapping.
                {exportReadiness.missingMappedValues.length > 0 && <><br />Ô thiếu giá trị: {exportReadiness.missingMappedValues.slice(0, 5).map((item) => `${item.sheetCode}.${item.lineCode}.${item.columnCode}`).join(', ')}{exportReadiness.missingMappedValues.length > 5 ? '…' : ''}</>}
              </>}
          />
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
