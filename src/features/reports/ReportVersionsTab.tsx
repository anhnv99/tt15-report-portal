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
  FileSpreadsheet,
} from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import type { CicReportVersion } from '@/types';

import { getStandardReportFileName } from '@/utils/reportFileNameHelper';
import { getVersionDestinationProfile, resolveVersionDestination } from '@/features/reporting-destinations/resolveReportDestination';

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
      title: 'Tên File Báo Cáo Chính Thức',
      key: 'fileName',
      width: 360,
      render: (_, r) => {
        const profile = getVersionDestinationProfile(r);
        const isWorkbookReport = profile.supportsExcelMapping;
        const autoName =
          r.fileName ||
          (isWorkbookReport
            ? `${r.reportCode}_79301001_${(r.reportingDate || '').replace(/-/g, '')}.v${r.versionNumber}.xlsx`
            : getStandardReportFileName(r.reportCode, r.reportingDate, r.versionNumber, '79301001', profile.defaultArtifactExtension));
        return (
          <Space style={{ whiteSpace: 'nowrap' }}>
            {isWorkbookReport ? <FileSpreadsheet size={16} color="#059669" /> : <FileText size={16} color="#003B95" />}
            <Tooltip title={profile.artifactDescription}>
              <Text
                strong
                copyable={{ text: autoName }}
                style={{
                  fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                  fontSize: 13,
                  color: isWorkbookReport ? '#065F46' : '#0F172A',
                  background: isWorkbookReport ? '#ECFDF5' : '#F1F5F9',
                  padding: '2px 8px',
                  borderRadius: 4,
                  border: isWorkbookReport ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
                }}
              >
                {autoName}
              </Text>
            </Tooltip>
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
                    description="Sau khi phê duyệt, phiên bản sẵn sàng được đóng gói và gửi đến đúng cổng tiếp nhận của biểu mẫu."
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
              <Tooltip title={`Nộp phiên bản này sang ${getVersionDestinationProfile(r).deliveryLabel}`}>
                <Button
                  type="primary"
                  shape="circle"
                  size="small"
                  icon={<Send size={14} />}
                  style={{ background: '#003B95', borderColor: '#003B95', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => onSend(r, resolveVersionDestination(r))}
                />
              </Tooltip>
            )}

            {onOpenAdjust && getVersionDestinationProfile(r).supportsWorkbookAdjustment && r.status !== 'APPROVED' && isEnabled && (
              <Tooltip title="Điều chỉnh workbook SBV và tính lại các dòng tổng">
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
