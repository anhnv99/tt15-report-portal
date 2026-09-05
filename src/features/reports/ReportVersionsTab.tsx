import React from 'react';
import { Table, Tag, Button, Space, Typography, Popconfirm, Tooltip, Switch } from 'antd';
import {
  Check,
  X,
  FileEdit,
  Package,
  History,
  FileText,
  Send,
} from 'lucide-react';
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
  onToggleActive?: (versionId: string) => Promise<void> | void;
  onSend?: (version: CicReportVersion, destination?: string) => Promise<void> | void;
}

export const ReportVersionsTab: React.FC<ReportVersionsTabProps> = ({
  versions,
  loading,
  onApprove,
  onOpenReject,
  onOpenArtifacts,
  onOpenTimeline,
  onOpenAdjust,
  onToggleActive,
  onSend,
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
      width: 90,
      render: (v) => <Text strong style={{ color: '#003B95' }}>v{v}</Text>,
    },
    {
      title: 'Tên File Báo Cáo Chuẩn QĐ573',
      key: 'fileName',
      width: 360,
      render: (_, r) => {
        const autoName = r.fileName || getStandardReportFileName(r.reportCode, r.reportingDate, r.versionNumber, '79301001', 'json');
        return (
          <Space style={{ whiteSpace: 'nowrap' }}>
            <FileText size={16} color="#003B95" />
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
      width: 120,
    },
    {
      title: 'Trạng Thái Duyệt',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (s: string) => <Tag color={getStatusColor(s)}>{s}</Tag>,
    },
    {
      title: 'Hiệu Lực',
      key: 'isActive',
      width: 150,
      render: (_, r) => {
        const isEnabled = r.isActive !== false;
        return (
          <Tooltip title={isEnabled ? 'Bấm để vô hiệu hóa (Disable) phiên bản này' : 'Bấm để kích hoạt lại (Enable) phiên bản này'}>
            <Space size="small">
              <Switch
                size="small"
                checked={isEnabled}
                onChange={() => onToggleActive?.(r.id)}
              />
              <Tag color={isEnabled ? 'green' : 'default'} style={{ fontSize: 11 }}>
                {isEnabled ? 'Khả dụng' : 'Vô hiệu'}
              </Tag>
            </Space>
          </Tooltip>
        );
      },
    },
    {
      title: 'Người Nộp / Tạo',
      dataIndex: 'submittedBy',
      key: 'submittedBy',
      width: 150,
      render: (u) => u || 'Hệ thống tự động',
    },
    {
      title: 'Thời Điểm Nộp',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 150,
      render: (d) => (d ? new Date(d).toLocaleString('vi-VN') : '-'),
    },
    {
      title: 'Thao Tác',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_, r) => {
        const isEnabled = r.isActive !== false;

        return (
          <Space size={6}>
            {r.status === 'DRAFT' && isEnabled && (
              <>
                <Tooltip title="Phê duyệt phiên bản báo cáo này">
                  <Popconfirm
                    title="Phê duyệt phiên bản báo cáo này?"
                    description="Sau khi phê duyệt, phiên bản sẽ sẵn sàng để đóng gói gửi sang cổng truyền nhận CIC/NHNN."
                    onConfirm={() => onApprove(r.id)}
                    okText="Duyệt"
                    cancelText="Hủy"
                  >
                    <Button
                      type="primary"
                      shape="circle"
                      size="small"
                      icon={<Check size={14} />}
                      style={{ background: '#10B981', borderColor: '#10B981', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    />
                  </Popconfirm>
                </Tooltip>

                <Tooltip title="Từ chối phiên bản báo cáo">
                  <Button
                    danger
                    shape="circle"
                    size="small"
                    icon={<X size={14} />}
                    onClick={() => onOpenReject(r.id)}
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                  />
                </Tooltip>
              </>
            )}

            {r.status === 'APPROVED' && isEnabled && onSend && (
              <Tooltip title="Nộp phiên bản này sang cổng CIC (H2H)">
                <Button
                  type="primary"
                  shape="circle"
                  size="small"
                  icon={<Send size={14} />}
                  style={{ background: '#003B95', borderColor: '#003B95', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => onSend(r, 'CIC')}
                />
              </Tooltip>
            )}

            {onOpenAdjust && r.status !== 'APPROVED' && isEnabled && (
              <Tooltip title="Điều chỉnh số liệu báo cáo từ Excel">
                <Button
                  shape="circle"
                  size="small"
                  icon={<FileEdit size={14} />}
                  style={{ color: '#003B95', borderColor: '#003B95', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => onOpenAdjust(r)}
                />
              </Tooltip>
            )}

            <Tooltip title="Xem & Tải tệp đóng gói báo cáo (ZIP / XLSX)">
              <Button
                shape="circle"
                size="small"
                icon={<Package size={14} />}
                onClick={() => onOpenArtifacts(r)}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              />
            </Tooltip>

            <Tooltip title="Xem lịch sử ký duyệt & kiểm định">
              <Button
                shape="circle"
                size="small"
                icon={<History size={14} />}
                onClick={() => onOpenTimeline(r.id)}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={versions}
      rowKey="id"
      loading={loading}
      pagination={{ pageSize: 10 }}
      scroll={{ x: 1350 }}
    />
  );
};
