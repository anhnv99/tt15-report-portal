import React from 'react';
import { Table, Tag, Button, Space, Typography, Popconfirm } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  HistoryOutlined,
  FileZipOutlined,
  FileTextOutlined,
  EditOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { CicReportVersion } from '@/types';

import { getStandardReportFileName } from '@/utils/reportFileNameHelper';

const { Text } = Typography;

interface ReportVersionsTabProps {
  versions: CicReportVersion[];
  loading: boolean;
  onApprove: (versionId: string) => Promise<void>;
  onOpenReject: (versionId: string) => void;
  onOpenArtifacts: (version: CicReportVersion) => void;
  onOpenTimeline: (versionId: string) => void;
  onOpenAdjust?: (version: CicReportVersion) => void;
}

export const ReportVersionsTab: React.FC<ReportVersionsTabProps> = ({
  versions,
  loading,
  onApprove,
  onOpenReject,
  onOpenArtifacts,
  onOpenTimeline,
  onOpenAdjust,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'SUBMITTED':
        return 'processing';
      case 'REJECTED':
        return 'error';
      case 'DRAFT':
      default:
        return 'default';
    }
  };

  const columns: ColumnsType<CicReportVersion> = [
    {
      title: 'Phiên Bản',
      dataIndex: 'versionNumber',
      key: 'versionNumber',
      width: 100,
      render: (v) => <Text strong style={{ color: '#003B95' }}>v{v}</Text>,
    },
    {
      title: 'Tên File Báo Cáo Chuẩn QĐ573',
      key: 'fileName',
      width: 380,
      render: (_, r) => {
        const autoName = r.fileName || getStandardReportFileName(r.reportCode, r.reportingDate, r.versionNumber, '79301001', 'json');
        return (
          <Space style={{ whiteSpace: 'nowrap' }}>
            <FileTextOutlined style={{ color: '#003B95', fontSize: 16 }} />
            <Text
              strong
              copyable={{ text: autoName }}
              style={{
                fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                fontSize: 13,
                color: '#0F172A',
                background: '#F1F5F9',
                padding: '2px 8px',
                borderRadius: 4,
                border: '1px solid #E2E8F0',
              }}
            >
              {autoName}
            </Text>
          </Space>
        );
      },
    },
    {
      title: 'Ngày Dữ Liệu',
      dataIndex: 'reportingDate',
      key: 'reportingDate',
      width: 130,
    },
    {
      title: 'Trạng Thái Duyệt',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (s: string) => <Tag color={getStatusColor(s)}>{s}</Tag>,
    },
    {
      title: 'Người Nộp / Tạo',
      dataIndex: 'submittedBy',
      key: 'submittedBy',
      width: 160,
      render: (u) => u || 'Hệ thống tự động',
    },
    {
      title: 'Thời Điểm Nộp',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 160,
      render: (d) => (d ? new Date(d).toLocaleString('vi-VN') : '-'),
    },
    {
      title: 'Thao Tác Nghiệp Vụ',
      key: 'actions',
      width: 330,
      fixed: 'right' as const,
      render: (_, r) => (
        <Space size="small" wrap>
          {r.status === 'DRAFT' && (
            <>
              <Popconfirm
                title="Phê duyệt phiên bản báo cáo này?"
                description="Sau khi phê duyệt, phiên bản sẽ sẵn sàng để đóng gói gửi sang cổng truyền nhận CIC/NHNN."
                onConfirm={() => onApprove(r.id)}
                okText="Duyệt"
                cancelText="Hủy"
              >
                <Button type="primary" size="small" icon={<CheckCircleOutlined />} style={{ background: '#10B981' }}>
                  Duyệt
                </Button>
              </Popconfirm>
              <Button
                danger
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() => onOpenReject(r.id)}
              >
                Từ Chối
              </Button>
            </>
          )}

          {onOpenAdjust && r.status !== 'APPROVED' && (
            <Button
              size="small"
              icon={<EditOutlined />}
              style={{ color: '#003B95', borderColor: '#003B95' }}
              onClick={() => onOpenAdjust(r)}
            >
              Điều Chỉnh
            </Button>
          )}

          <Button
            size="small"
            icon={<FileZipOutlined />}
            onClick={() => onOpenArtifacts(r)}
          >
            Tệp Đóng Gói (ZIP)
          </Button>

          <Button
            size="small"
            icon={<HistoryOutlined />}
            onClick={() => onOpenTimeline(r.id)}
          >
            Lịch Sử
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={versions}
      rowKey="id"
      loading={loading}
      pagination={{ pageSize: 10 }}
      scroll={{ x: 1400 }}
    />
  );
};
