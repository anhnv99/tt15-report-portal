import React from 'react';
import { Table, Tag, Button, Space, Typography, Popconfirm, Row, Col, Tooltip } from 'antd';
import {
  PlayCircleOutlined,
  EyeOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import { ShieldCheck, Eye, GitBranch } from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import type { ReportAggregation } from '@/types';

const { Text } = Typography;

interface ReportAggregationsTabProps {
  aggregations: ReportAggregation[];
  loading: boolean;
  onAutoAggregate: () => Promise<void>;
  onOpenManualAggregation: () => void;
  onRunRulesCheck: (aggId: string) => Promise<void>;
  onOpenLineage: (aggId: string) => void;
  onOpenValidation: (aggId: string) => void;
}

export const ReportAggregationsTab: React.FC<ReportAggregationsTabProps> = ({
  aggregations,
  loading,
  onAutoAggregate,
  onOpenManualAggregation,
  onRunRulesCheck,
  onOpenLineage,
  onOpenValidation,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'RUNNING':
        return 'processing';
      case 'FAILED':
        return 'error';
      case 'CREATED':
      default:
        return 'default';
    }
  };

  const columns: ColumnsType<ReportAggregation> = [
    {
      title: 'Mã Tổng Hợp',
      dataIndex: 'id',
      key: 'id',
      width: 140,
      render: (id) => <Text code strong>{id}</Text>,
    },
    {
      title: 'Biểu Mẫu',
      dataIndex: 'reportCode',
      key: 'reportCode',
      width: 110,
      render: (c) => <Tag color="blue">{c}</Tag>,
    },
    {
      title: 'Kỳ Dữ Liệu',
      dataIndex: 'dataPeriodCode',
      key: 'dataPeriodCode',
      width: 130,
      render: (c) => <Text strong>{c}</Text>,
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (s: string) => <Tag color={getStatusColor(s)}>{s}</Tag>,
    },
    {
      title: 'Số Lô Nguồn',
      dataIndex: 'sourceBatchCount',
      key: 'sourceBatchCount',
      width: 110,
      render: (c) => c || 0,
    },
    {
      title: 'Tổng Số Bản Ghi',
      dataIndex: 'totalRecords',
      key: 'totalRecords',
      width: 140,
      render: (c) => (c ? c.toLocaleString() : '0'),
    },
    {
      title: 'Thời Gian Thực Hiện',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (d) => (d ? new Date(d).toLocaleString('vi-VN') : '-'),
    },
    {
      title: 'Thao Tác',
      key: 'actions',
      width: 140,
      render: (_, r) => (
        <Space size={6}>
          <Tooltip title="Thực thi kiểm tra Validation Rules 3 cấp">
            <Popconfirm
              title="Thực thi kiểm tra Validation Rules?"
              description="Hệ thống sẽ chạy bộ quy tắc kiểm tra 3 cấp (định dạng trường, nội kiểm logic, và đối soát chéo) trên dữ liệu đợt này."
              onConfirm={() => onRunRulesCheck(r.id)}
              okText="Chạy Kiểm Tra"
              cancelText="Hủy"
            >
              <Button
                type="primary"
                shape="circle"
                size="small"
                icon={<ShieldCheck size={14} />}
                style={{ background: '#003B95', borderColor: '#003B95', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              />
            </Popconfirm>
          </Tooltip>

          <Tooltip title="Xem danh sách vi phạm & cảnh báo rules">
            <Button
              shape="circle"
              size="small"
              icon={<Eye size={14} />}
              onClick={() => onOpenValidation(r.id)}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            />
          </Tooltip>

          <Tooltip title="Xem nguồn dữ liệu lô thành phần (Lineage)">
            <Button
              shape="circle"
              size="small"
              icon={<GitBranch size={14} />}
              onClick={() => onOpenLineage(r.id)}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Text strong style={{ fontSize: 14 }}>
            Lịch Sử Các Đợt Tổng Hợp Dữ Liệu Báo Cáo:
          </Text>
        </Col>
        <Col>
          <Space>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              style={{ background: '#003B95' }}
              onClick={onAutoAggregate}
            >
              Khởi Chạy Tổng Hợp Tự Động
            </Button>
            <Button
              icon={<ThunderboltOutlined />}
              onClick={onOpenManualAggregation}
            >
              Tổng Hợp Thủ Công (Chọn Lô)
            </Button>
          </Space>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={aggregations}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};
