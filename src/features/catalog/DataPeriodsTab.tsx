import React from 'react';
import { Table, Tag, Button, Space, Typography, Popconfirm, Row, Col, Tooltip } from 'antd';
import { PlusOutlined, ThunderboltOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import { Lock, Unlock } from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import type { DataPeriod } from '@/types';

const { Text } = Typography;

interface DataPeriodsTabProps {
  periods: DataPeriod[];
  loading: boolean;
  onOpenCreate: () => void;
  onOpenGenerate: () => void;
  onToggleClose: (period: DataPeriod) => Promise<void>;
}

export const DataPeriodsTab: React.FC<DataPeriodsTabProps> = ({
  periods,
  loading,
  onOpenCreate,
  onOpenGenerate,
  onToggleClose,
}) => {
  const columns: ColumnsType<DataPeriod> = [
    {
      title: 'Mã Kỳ',
      dataIndex: 'code',
      key: 'code',
      width: 140,
      render: (c) => <Text code strong style={{ color: '#003B95' }}>{c}</Text>,
    },
    {
      title: 'Tên Kỳ Dữ Liệu',
      dataIndex: 'name',
      key: 'name',
      render: (n) => <Text strong>{n}</Text>,
    },
    {
      title: 'Loại Kỳ',
      dataIndex: 'periodType',
      key: 'periodType',
      width: 170,
      render: (t, r) => {
        let val = t || (r as any).periodTypeName;
        if (!val) {
          if (r.code.includes('_3D') || r.code.includes('3NGAY')) val = '3 Ngày';
          else if (r.code.includes('_15D') || r.code.includes('15NGAY')) val = 'Bán nguyệt (15 ngày)';
          else if (r.code.includes('EVENT')) val = 'Theo sự kiện';
          else val = 'Hàng tháng';
        }
        const colorMap: Record<string, string> = {
          '3 Ngày': 'cyan',
          'Theo sự kiện': 'purple',
          'Bán nguyệt (15 ngày)': 'orange',
          'Hàng tháng': 'green',
          'Hàng năm': 'gold',
          'Hàng quý': 'blue',
        };
        return <Tag color={colorMap[val] || 'blue'}>{val}</Tag>;
      },
    },
    {
      title: 'Từ Ngày',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
    },
    {
      title: 'Đến Ngày',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120,
    },
    {
      title: 'Hạn Nộp Báo Cáo',
      dataIndex: 'reportingDeadline',
      key: 'reportingDeadline',
      width: 140,
      render: (d) => (d ? <Text type="danger">{d}</Text> : '-'),
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'closed',
      key: 'closed',
      width: 120,
      render: (closed) => (
        <Tag color={closed ? 'error' : 'success'}>
          {closed ? 'ĐÃ ĐÓNG SỔ' : 'ĐANG MỞ'}
        </Tag>
      ),
    },
    {
      title: 'Thao Tác',
      key: 'actions',
      width: 100,
      render: (_, r) => (
        <Tooltip title={r.closed ? 'Mở lại sổ kỳ dữ liệu này' : 'Khóa sổ (Đóng kỳ) dữ liệu này'}>
          <Popconfirm
            title={r.closed ? 'Mở lại kỳ dữ liệu này?' : 'Đóng sổ kỳ dữ liệu này?'}
            description={
              r.closed
                ? 'Mở lại kỳ sẽ cho phép nạp thêm dữ liệu và tổng hợp lại báo cáo.'
                : 'Đóng kỳ sẽ khóa không cho phép nạp đè dữ liệu.'
            }
            onConfirm={() => onToggleClose(r)}
            okText={r.closed ? 'Mở Kỳ' : 'Đóng Sổ'}
            cancelText="Hủy"
          >
            <Button
              shape="circle"
              size="small"
              type={r.closed ? 'default' : 'primary'}
              danger={!r.closed}
              icon={r.closed ? <Unlock size={14} /> : <Lock size={14} />}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            />
          </Popconfirm>
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Text strong style={{ fontSize: 14 }}>
            Danh Sách Các Kỳ Dữ Liệu Báo Cáo ({periods.length}):
          </Text>
        </Col>
        <Col>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ background: '#003B95' }}
              onClick={onOpenCreate}
            >
              Tạo Kỳ Mới
            </Button>
            <Button
              icon={<ThunderboltOutlined />}
              onClick={onOpenGenerate}
            >
              Khởi Tạo Tự Động Theo Năm
            </Button>
          </Space>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={periods}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 12 }}
      />
    </div>
  );
};
