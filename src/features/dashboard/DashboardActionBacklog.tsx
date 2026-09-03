import React from 'react';
import { Card, Typography, Space, Badge, Tabs, Empty, Table, Tag, Button } from 'antd';
import {
  ToolOutlined,
  ClockCircleOutlined,
  AuditOutlined,
  WarningOutlined,
  RightCircleOutlined,
} from '@ant-design/icons';
import type { DashboardPendingStats } from './DashboardKpiCards';

const { Title: AntTitle, Text: AntText } = Typography;

interface DashboardActionBacklogProps {
  pendingStats: DashboardPendingStats;
  onNavigateImports: () => void;
  onNavigateReports: () => void;
}

export const DashboardActionBacklog: React.FC<DashboardActionBacklogProps> = ({
  pendingStats,
  onNavigateImports,
  onNavigateReports,
}) => {
  return (
    <Card
      style={{
        marginBottom: 16,
        borderRadius: 8,
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
      bodyStyle={{ padding: '16px 20px' }}
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
        defaultActiveKey="staged"
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
                          <Space direction="vertical" size={0}>
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
                        title: 'Số Dòng Hợp Lệ',
                        dataIndex: 'validRows',
                        key: 'validRows',
                        width: 150,
                        render: (v, r) => (
                          <Tag color="success">
                            <b>{v ?? r.totalRows ?? 0}</b> dòng hợp lệ
                          </Tag>
                        ),
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
                          <AntText strong style={{ color: '#003B95' }}>
                            {c}
                          </AntText>
                        ),
                      },
                      {
                        title: 'Phiên Bản',
                        dataIndex: 'versionNumber',
                        key: 'versionNumber',
                        width: 100,
                        render: (v) => <Tag color="purple">v{v}</Tag>,
                      },
                      {
                        title: 'Tên File Chuẩn QĐ573',
                        dataIndex: 'fileNameStandard',
                        key: 'fileNameStandard',
                        render: (f) => (
                          <AntText code style={{ fontSize: 11 }}>
                            {f || '-'}
                          </AntText>
                        ),
                      },
                      {
                        title: 'Trạng Thái',
                        dataIndex: 'status',
                        key: 'status',
                        width: 120,
                        render: () => <Tag color="warning">Bản Nháp (Draft)</Tag>,
                      },
                      {
                        title: 'Hành Động Cần Làm',
                        key: 'actions',
                        width: 210,
                        render: () => (
                          <Space>
                            <Button
                              type="primary"
                              size="small"
                              icon={<RightCircleOutlined />}
                              style={{ background: '#4F46E5', borderColor: '#4F46E5' }}
                              onClick={onNavigateReports}
                            >
                              Kiểm Tra Rules & Duyệt
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
                          <Space direction="vertical" size={0}>
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
                        width: 140,
                        render: (_, r) => (
                          <Tag color="error">
                            <b>{r.errorRows || 0}</b> / {r.totalRows || 0} dòng
                          </Tag>
                        ),
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
