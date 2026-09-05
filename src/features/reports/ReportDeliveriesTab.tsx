import React, { useMemo } from 'react';
import { Table, Tag, Button, Space, Typography, Row, Col, Card, Dropdown } from 'antd';
import {
  SendOutlined,
  RedoOutlined,
  DownOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { ReportDelivery, CicReportVersion } from '@/types';

const { Text } = Typography;

interface ReportDeliveriesTabProps {
  deliveries: ReportDelivery[];
  versions: CicReportVersion[];
  loading: boolean;
  onDispatch: (deliveryId: string) => Promise<void>;
  onRetry: (deliveryId: string) => Promise<void>;
  onSendApprovedVersion: (version: CicReportVersion, destination?: string) => Promise<void>;
}

export const ReportDeliveriesTab: React.FC<ReportDeliveriesTabProps> = ({
  deliveries,
  versions,
  loading,
  onDispatch,
  onRetry,
  onSendApprovedVersion,
}) => {
  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'success';
      case 'ACCEPTED':
      case 'SUBMITTED':
      case 'SENDING':
        return 'processing';
      case 'FAILED':
        return 'error';
      case 'PENDING':
      default:
        return 'warning';
    }
  };

  const deliveryKpis = useMemo(() => {
    const total = deliveries.length;
    const pending = deliveries.filter((d) => d.status === 'PENDING').length;
    const accepted = deliveries.filter((d) => d.status === 'ACCEPTED' || d.status === 'SENDING').length;
    const delivered = deliveries.filter((d) => d.status === 'DELIVERED').length;
    const failed = deliveries.filter((d) => d.status === 'FAILED').length;
    return { total, pending, accepted, delivered, failed };
  }, [deliveries]);

  // List approved versions that don't have an accepted/delivered transmission yet
  const pendingApprovedVersions = useMemo(() => {
    const deliveredVersionIds = new Set(
      deliveries
        .filter((d) => d.status === 'ACCEPTED' || d.status === 'DELIVERED')
        .map((d) => d.reportVersionId)
    );
    return versions.filter((v) => v.status === 'APPROVED' && !deliveredVersionIds.has(v.id));
  }, [versions, deliveries]);

  const deliveryColumns: ColumnsType<ReportDelivery> = [
    {
      title: 'Mã Phiên Bản',
      dataIndex: 'reportVersionId',
      key: 'reportVersionId',
      width: 130,
      render: (id) => <Text code strong>{id ? id.substring(0, 8) : '-'}</Text>,
    },
    {
      title: 'Đích Tiếp Nhận',
      dataIndex: 'destination',
      key: 'destination',
      width: 140,
      render: (dest) => {
        const d = (dest || 'CIC').toUpperCase();
        if (d.includes('SBV') || d.includes('SVB')) return <Tag color="green" icon={<SafetyCertificateOutlined />}>SBV (NHNN)</Tag>;
        if (d.includes('PCB')) return <Tag color="orange" icon={<GlobalOutlined />}>PCB</Tag>;
        return <Tag color="blue" icon={<BankOutlined />}>CIC (H2H)</Tag>;
      },
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (s: string) => {
        const color = getDeliveryStatusColor(s);
        const label = s === 'ACCEPTED' ? 'ĐÃ TIẾP NHẬN (202)' : s;
        return <Tag color={color} style={{ fontWeight: 600 }}>{label}</Tag>;
      },
    },
    {
      title: 'Thời Gian Gửi',
      key: 'dispatchedAt',
      width: 160,
      render: (_, r) => {
        const d = r.lastAttemptAt || r.dispatchedAt;
        return d ? new Date(d).toLocaleString('vi-VN') : '-';
      },
    },
    {
      title: 'Thời Gian Xác Nhận',
      key: 'deliveredAt',
      width: 160,
      render: (_, r) => {
        const d = r.deliveredAt || r.acceptedAt;
        return d ? new Date(d).toLocaleString('vi-VN') : '-';
      },
    },
    {
      title: 'Lần Thử',
      key: 'attemptCount',
      width: 90,
      render: (_, r) => <Tag>{r.attemptCount ?? r.retryCount ?? 0} lần</Tag>,
    },
    {
      title: 'Mã Tiếp Nhận CIC / Phản Hồi Webhook',
      key: 'receiptReference',
      render: (_, row) => {
        const extId = row.externalId || row.receiptReference;
        const msg = row.message || row.errorMessage;
        return (
          <Space direction="vertical" size={2}>
            <Space>
              {extId ? (
                <Text code strong style={{ color: '#003B95', background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                  {extId}
                </Text>
              ) : (
                <Text type="secondary">-</Text>
              )}
              {row.httpStatus && (
                <Tag color={row.httpStatus === 202 || row.httpStatus === 200 ? 'cyan' : 'red'} style={{ fontSize: 11 }}>
                  HTTP {row.httpStatus}
                </Tag>
              )}
            </Space>
            {msg && (
              <div style={{ color: row.status === 'FAILED' ? '#EF4444' : '#475569', fontSize: 12, lineHeight: 1.3 }}>
                {msg}
              </div>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Thao Tác',
      key: 'actions',
      width: 120,
      render: (_, r) => (
        <Space size="small">
          {r.status === 'PENDING' && (
            <Button
              type="primary"
              size="small"
              icon={<SendOutlined />}
              style={{ background: '#003B95' }}
              onClick={() => onDispatch(r.id)}
            >
              Gửi Ngay
            </Button>
          )}
          {r.status === 'FAILED' && (
            <Button
              danger
              size="small"
              icon={<RedoOutlined />}
              onClick={() => onRetry(r.id)}
            >
              Thử Lại
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* KPI Cards */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 8, borderLeft: '4px solid #F59E0B' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Đang Chờ Gửi (Pending)</Text>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#F59E0B' }}>
              {deliveryKpis.pending}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 8, borderLeft: '4px solid #3B82F6' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Đã Tiếp Nhận (Accepted 202)</Text>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#3B82F6' }}>
              {deliveryKpis.accepted}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 8, borderLeft: '4px solid #10B981' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Gửi Thành Công (Delivered)</Text>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#10B981' }}>
              {deliveryKpis.delivered}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 8, borderLeft: '4px solid #EF4444' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Thất Bại (Failed - Cần Thử Lại)</Text>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#EF4444' }}>
              {deliveryKpis.failed}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Pending Approved Versions to Dispatch */}
      {pendingApprovedVersions.length > 0 && (
        <Card
          size="small"
          style={{ marginBottom: 16, background: '#F0FDF4', borderColor: '#BBF7D0', borderRadius: 8 }}
        >
          <Row justify="space-between" align="middle">
            <Col>
              <Text strong style={{ color: '#166534' }}>
                Có {pendingApprovedVersions.length} phiên bản báo cáo đã được phê duyệt sẵn sàng nộp sang CIC:
              </Text>
            </Col>
            <Col>
              <Space>
                {pendingApprovedVersions.slice(0, 3).map((v) => (
                  <Dropdown
                    key={v.id}
                    menu={{
                      items: [
                        { key: 'CIC', label: 'Nộp sang CIC (H2H)', icon: <BankOutlined /> },
                        { key: 'SBV', label: 'Nộp sang SBV (NHNN)', icon: <SafetyCertificateOutlined /> },
                        { key: 'PCB', label: 'Nộp sang PCB', icon: <GlobalOutlined /> },
                      ],
                      onClick: ({ key }) => onSendApprovedVersion(v, key),
                    }}
                  >
                    <Button
                      size="small"
                      type="primary"
                      icon={<SendOutlined />}
                      style={{ background: '#16A34A' }}
                    >
                      Nộp v{v.versionNumber} ({v.fileName || 'Báo cáo'}) <DownOutlined />
                    </Button>
                  </Dropdown>
                ))}
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      {/* Delivery Table */}
      <Table
        columns={deliveryColumns}
        dataSource={deliveries}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};
