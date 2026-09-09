import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Badge, Tabs, Empty, Table, Tag, Button, Popconfirm } from 'antd';
import {
  ToolOutlined,
  ClockCircleOutlined,
  AuditOutlined,
  WarningOutlined,
  RightCircleOutlined,
  CheckCircleOutlined,
  SendOutlined,
} from '@ant-design/icons';
import type { DashboardPendingStats } from './DashboardKpiCards';
import type { DataPeriod } from '@/types';

const { Title: AntTitle, Text: AntText } = Typography;

interface DashboardActionBacklogProps {
  pendingStats: DashboardPendingStats;
  periods?: DataPeriod[];
  onNavigateImports: () => void;
  onNavigateReports: () => void;
  onNavigateReportWithParam?: (template: string, periodCode?: string) => void;
  onApproveReport?: (versionId: string) => Promise<void>;
}

export const DashboardActionBacklog: React.FC<DashboardActionBacklogProps> = ({
  pendingStats,
  periods = [],
  onNavigateImports,
  onNavigateReports,
  onNavigateReportWithParam,
  onApproveReport,
}) => {
  const [activeTab, setActiveTab] = useState<string>('staged');

  useEffect(() => {
    if (pendingStats.stagedBatches.length === 0 && pendingStats.draftReports.length > 0) {
      setActiveTab('draft-reports');
    }
  }, [pendingStats.stagedBatches.length, pendingStats.draftReports.length]);

  const [approvingId, setApprovingId] = useState<string | null>(null);

  return (
    <Card
      style={{
        marginBottom: 16,
        borderRadius: 8,
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
      styles={{ body: { padding: '16px 20px' } }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <Space>
          <ToolOutlined style={{ color: '#003B95', fontSize: 18 }} />
          <AntTitle level={5} style={{ margin: 0, color: '#0F172A' }}>
            Trung Tâm Tác Vụ Cần Xử Lý Ngay (Action Items Required)
          </AntTitle>
          <Badge
            count={
              pendingStats.stagedBatches.length +
              pendingStats.errorBatches.length +
              pendingStats.draftReports.length +
              pendingStats.rejectedBatches.length
            }
            style={{ backgroundColor: '#EF4444' }}
          />
        </Space>
        <AntText type="secondary" style={{ fontSize: 12 }}>
          Các đầu việc cần Maker/Checker can thiệp để bảo đảm hạn nộp báo cáo NHNN
        </AntText>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        size="small"
        items={[
          {
            key: 'staged',
            label: (
              <Space>
                <ClockCircleOutlined style={{ color: '#D97706' }} />
                <span>Lô Chờ Checker Phê Duyệt ({pendingStats.stagedBatches.length})</span>
              </Space>
            ),
            children: (
              <div>
                {pendingStats.stagedBatches.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Hiện không có lô dữ liệu nào đang chờ duyệt"
                  />
                ) : (
                  <Table
                    dataSource={pendingStats.stagedBatches}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    size="small"
                    columns={[
                      {
                        title: 'Mã Lô',
                        dataIndex: 'batchCode',
                        key: 'batchCode',
                        width: 150,
                        render: (c, r) => (
                          <Space orientation="vertical" size={0}>
                            <AntText strong style={{ color: '#003B95' }}>
                              {c}
                            </AntText>
                            <Tag color="blue" style={{ fontSize: 10, width: 'fit-content' }}>
                              {r.importType || 'D10'}
                            </Tag>
                          </Space>
                        ),
                      },
                      {
                        title: 'Tên Tệp Nguồn',
                        dataIndex: 'originalFileName',
                        key: 'originalFileName',
                        render: (f, r) => f || r.fileName || '-',
                      },
                      {
                        title: 'Dòng Hợp Lệ Chờ Duyệt',
                        dataIndex: 'validRows',
                        key: 'validRows',
                        width: 170,
                        render: (v, r) => {
                          const valid = typeof v === 'number' ? v : (r.validRows ?? 0);
                          if (valid > 0) {
                            return (
                              <Tag color="success">
                                <b>{valid}</b> dòng hợp lệ
                              </Tag>
                            );
                          }
                          return (
                            <Tag color="warning">
                              Chưa có dòng hợp lệ
                            </Tag>
                          );
                        },
                      },
                      {
                        title: 'Thời Gian Nạp',
                        dataIndex: 'createdAt',
                        key: 'createdAt',
                        width: 160,
                        render: (d) => (d ? new Date(d).toLocaleString('vi-VN') : '-'),
                      },
                      {
                        title: 'Hành Động Cần Làm',
                        key: 'actions',
                        width: 170,
                        render: () => (
                          <Button
                            type="primary"
                            size="small"
                            icon={<RightCircleOutlined />}
                            style={{ background: '#0284C7', borderColor: '#0284C7' }}
                            onClick={onNavigateImports}
                          >
                            Phê Duyệt Lô
                          </Button>
                        ),
                      },
                    ]}
                  />
                )}
              </div>
            ),
          },
          {
            key: 'draft-reports',
            label: (
              <Space>
                <AuditOutlined style={{ color: '#4F46E5' }} />
                <span>Báo Cáo Nháp Cần Ký Duyệt ({pendingStats.draftReports.length})</span>
              </Space>
            ),
            children: (
              <div>
                {pendingStats.draftReports.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Tất cả các phiên bản báo cáo đã được duyệt"
                  />
                ) : (
                  <Table
                    dataSource={pendingStats.draftReports}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    size="small"
                    columns={[
                      {
                        title: 'Mã Biểu Mẫu',
                        dataIndex: 'reportCode',
                        key: 'reportCode',
                        width: 130,
                        render: (c) => (
                          <Space orientation="vertical" size={2}>
                            <AntText strong style={{ color: '#003B95', fontSize: 13 }}>
                              {c}
                            </AntText>
                            <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>TT15/NHNN</Tag>
                          </Space>
                        ),
                      },
                      {
                        title: 'Kỳ Dữ Liệu Báo Cáo',
                        key: 'dataPeriod',
                        width: 200,
                        render: (_, r) => {
                          const p = periods.find((item) => item.id === r.dataPeriodId || item.code === String(r.dataPeriodId));
                          return (
                            <div>
                              <AntText strong style={{ fontSize: 12 }}>
                                {p?.name || `Kỳ ${r.reportingDate || r.dataPeriodId}`}
                              </AntText>
                              <div style={{ fontSize: 11, color: '#64748B' }}>
                                Mã kỳ: <AntText code style={{ fontSize: 11 }}>{p?.code || r.dataPeriodId}</AntText>
                              </div>
                            </div>
                          );
                        },
                      },
                      {
                        title: 'Phiên Bản & Ngày Báo Cáo',
                        key: 'version',
                        width: 170,
                        render: (_, r) => (
                          <Space orientation="vertical" size={2}>
                            <Tag color="purple" style={{ fontWeight: 600 }}>v{r.versionNumber}</Tag>
                            <span style={{ fontSize: 11, color: '#64748B' }}>
                              Ngày BC: {r.reportingDate || '-'}
                            </span>
                          </Space>
                        ),
                      },
                      {
                        title: 'Gói Tin Dự Kiến (QĐ573)',
                        key: 'expectedFile',
                        render: (_, r) => {
                          const cleanDate = (r.reportingDate || '').replace(/[^0-9]/g, '') || '20260930';
                          const fileName = `CIC_${r.reportCode}_${cleanDate}_v${r.versionNumber}.xml`;
                          return (
                            <Space orientation="vertical" size={0}>
                              <AntText code style={{ fontSize: 11, color: '#0F172A' }}>
                                {fileName}
                              </AntText>
                              <span style={{ fontSize: 10, color: '#10B981' }}>Chuẩn phân cấp Phụ lục II</span>
                            </Space>
                          );
                        },
                      },
                      {
                        title: 'Trạng Thái',
                        dataIndex: 'status',
                        key: 'status',
                        width: 140,
                        render: () => (
                          <Tag color="warning" icon={<ClockCircleOutlined />} style={{ fontWeight: 500 }}>
                            Chờ Ký Duyệt
                          </Tag>
                        ),
                      },
                      {
                        title: 'Hành Động Cần Làm',
                        key: 'actions',
                        width: 240,
                        render: (_, r) => (
                          <Space size={6}>
                            {onApproveReport && (
                              <Popconfirm
                                title="Ký duyệt phiên bản báo cáo này?"
                                description={`Phê duyệt biểu mẫu ${r.reportCode} (v${r.versionNumber}) để chuyển sang hàng đợi truyền nhận.`}
                                onConfirm={async () => {
                                  setApprovingId(r.id);
                                  try {
                                    await onApproveReport(r.id);
                                  } finally {
                                    setApprovingId(null);
                                  }
                                }}
                                okText="Ký Duyệt"
                                cancelText="Hủy"
                                okButtonProps={{
                                  loading: approvingId === r.id,
                                  style: { background: '#10B981', borderColor: '#10B981' }
                                }}
                              >
                                <Button
                                  type="primary"
                                  size="small"
                                  icon={<CheckCircleOutlined />}
                                  loading={approvingId === r.id}
                                  disabled={approvingId !== null}
                                  style={{ background: '#10B981', borderColor: '#10B981', fontWeight: 500 }}
                                >
                                  Ký Duyệt
                                </Button>
                              </Popconfirm>
                            )}
                            <Button
                              size="small"
                              icon={<RightCircleOutlined />}
                              style={{ borderColor: '#003B95', color: '#003B95' }}
                              onClick={() => {
                                const p = periods.find((item) => item.id === r.dataPeriodId);
                                if (onNavigateReportWithParam) {
                                  onNavigateReportWithParam(r.reportCode, p?.code || String(r.dataPeriodId));
                                } else {
                                  onNavigateReports();
                                }
                              }}
                            >
                              Xem & Rules
                            </Button>
                          </Space>
                        ),
                      },
                    ]}
                  />
                )}
              </div>
            ),
          },
          {
            key: 'approved-reports',
            label: (
              <Space>
                <CheckCircleOutlined style={{ color: '#10B981' }} />
                <span>Báo Cáo Đã Duyệt Sẵn Sàng Gửi ({pendingStats.approvedReports.length})</span>
              </Space>
            ),
            children: (
              <div>
                {pendingStats.approvedReports.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Chưa có báo cáo nào đã duyệt hoàn tất"
                  />
                ) : (
                  <Table
                    dataSource={pendingStats.approvedReports}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    size="small"
                    columns={[
                      {
                        title: 'Mã Biểu Mẫu',
                        dataIndex: 'reportCode',
                        key: 'reportCode',
                        width: 130,
                        render: (c) => (
                          <Space orientation="vertical" size={2}>
                            <AntText strong style={{ color: '#003B95', fontSize: 13 }}>
                              {c}
                            </AntText>
                            <Tag color="green" style={{ fontSize: 10, margin: 0 }}>ĐÃ DUYỆT</Tag>
                          </Space>
                        ),
                      },
                      {
                        title: 'Kỳ Dữ Liệu Báo Cáo',
                        key: 'dataPeriod',
                        width: 200,
                        render: (_, r) => {
                          const p = periods.find((item) => item.id === r.dataPeriodId || item.code === String(r.dataPeriodId));
                          return (
                            <div>
                              <AntText strong style={{ fontSize: 12 }}>
                                {p?.name || `Kỳ ${r.reportingDate || r.dataPeriodId}`}
                              </AntText>
                              <div style={{ fontSize: 11, color: '#64748B' }}>
                                Mã kỳ: <AntText code style={{ fontSize: 11 }}>{p?.code || r.dataPeriodId}</AntText>
                              </div>
                            </div>
                          );
                        },
                      },
                      {
                        title: 'Phiên Bản',
                        dataIndex: 'versionNumber',
                        key: 'versionNumber',
                        width: 120,
                        render: (v) => <Tag color="purple">v{v}</Tag>,
                      },
                      {
                        title: 'Trạng Thái',
                        dataIndex: 'status',
                        key: 'status',
                        width: 140,
                        render: () => <Tag color="success" icon={<CheckCircleOutlined />}>Đã Phê Duyệt</Tag>,
                      },
                      {
                        title: 'Hành Động Cần Làm',
                        key: 'actions',
                        width: 220,
                        render: (_, r) => (
                          <Button
                            type="primary"
                            size="small"
                            icon={<SendOutlined />}
                            style={{ background: '#0284C7', borderColor: '#0284C7' }}
                            onClick={() => {
                              const p = periods.find((item) => item.id === r.dataPeriodId);
                              if (onNavigateReportWithParam) {
                                onNavigateReportWithParam(r.reportCode, p?.code || String(r.dataPeriodId));
                              } else {
                                onNavigateReports();
                              }
                            }}
                          >
                            Chuyển Sang Truyền Nhận
                          </Button>
                        ),
                      },
                    ]}
                  />
                )}
              </div>
            ),
          },
          {
            key: 'errors',
            label: (
              <Space>
                <WarningOutlined style={{ color: '#DC2626' }} />
                <span>
                  Lô Có Lỗi & Bị Từ Chối (
                  {pendingStats.errorBatches.length + pendingStats.rejectedBatches.length})
                </span>
              </Space>
            ),
            children: (
              <div>
                {pendingStats.errorBatches.length + pendingStats.rejectedBatches.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Tuyệt vời! Không có lô nào bị lỗi hoặc từ chối"
                  />
                ) : (
                  <Table
                    dataSource={[...pendingStats.errorBatches, ...pendingStats.rejectedBatches]}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    size="small"
                    columns={[
                      {
                        title: 'Mã Lô',
                        dataIndex: 'batchCode',
                        key: 'batchCode',
                        width: 150,
                        render: (c, r) => (
                          <Space orientation="vertical" size={0}>
                            <AntText strong style={{ color: '#DC2626' }}>
                              {c}
                            </AntText>
                            <Tag color={r.status === 'REJECTED' ? 'error' : 'warning'}>
                              {r.status === 'REJECTED' ? 'Bị Từ Chối' : 'Có Lỗi'}
                            </Tag>
                          </Space>
                        ),
                      },
                      {
                        title: 'Tệp Dữ Liệu',
                        dataIndex: 'originalFileName',
                        key: 'originalFileName',
                        render: (f, r) => f || r.fileName || '-',
                      },
                      {
                        title: 'Dòng Lỗi Cần Sửa',
                        key: 'errorRows',
                        width: 150,
                        render: (_, r) => {
                          const err = r.errorRows || 0;
                          const total = r.totalRows || (err > 0 ? err + (r.validRows || 0) : 0);
                          return (
                            <Tag color="error">
                              <b>{err}</b> {total > 0 ? `/ ${total} dòng` : 'dòng lỗi'}
                            </Tag>
                          );
                        },
                      },
                      {
                        title: 'Lý Do / Ghi Chú',
                        dataIndex: 'rejectionReason',
                        key: 'rejectionReason',
                        render: (n) => n || 'Dữ liệu phát hiện lỗi hoặc chờ Maker bổ sung',
                      },
                      {
                        title: 'Hành Động Cần Làm',
                        key: 'actions',
                        width: 180,
                        render: () => (
                          <Button
                            danger
                            size="small"
                            icon={<RightCircleOutlined />}
                            onClick={onNavigateImports}
                          >
                            Bổ Sung / Sửa Lỗi
                          </Button>
                        ),
                      },
                    ]}
                  />
                )}
              </div>
            ),
          },
        ]}
      />
    </Card>
  );
};
