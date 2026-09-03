import React from 'react';
import { Drawer, Spin, Table, Tag, Typography, Alert, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { AggregationSourceBatch } from '@/types';

const { Text } = Typography;

interface AggregationLineageDrawerProps {
  open: boolean;
  batches: AggregationSourceBatch[];
  loading: boolean;
  onClose: () => void;
}

export const AggregationLineageDrawer: React.FC<AggregationLineageDrawerProps> = ({
  open,
  batches,
  loading,
  onClose,
}) => {
  const columns: ColumnsType<AggregationSourceBatch> = [
    {
      title: 'Mã Đợt Import',
      dataIndex: 'batchId',
      key: 'batchId',
      width: 140,
      render: (id) => <Text code>{id}</Text>,
    },
    {
      title: 'Tên Tệp Nguồn',
      dataIndex: 'fileName',
      key: 'fileName',
      render: (f) => <Text strong>{f}</Text>,
    },
    {
      title: 'Loại Báo Cáo',
      dataIndex: 'importType',
      key: 'importType',
      width: 130,
      render: (t) => <Tag color="blue">{t}</Tag>,
    },
    {
      title: 'Tổng Số Dòng',
      dataIndex: 'totalRows',
      key: 'totalRows',
      width: 120,
      render: (c) => c?.toLocaleString() || 0,
    },
    {
      title: 'Dòng Đã Staging',
      dataIndex: 'stagedRowsCount',
      key: 'stagedRowsCount',
      width: 130,
      render: (c) => <Tag color="green">{c?.toLocaleString() || 0}</Tag>,
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (s: string) => <Tag color={s === 'APPROVED' ? 'success' : 'default'}>{s}</Tag>,
    },
  ];

  return (
    <Drawer
      title="Nguồn Dữ Liệu Gốc Của Đợt Tổng Hợp (Lineage)"
      placement="right"
      width={780}
      onClose={onClose}
      open={open}
    >
      <Spin spinning={loading}>
        <Alert
          message="Truy vết nguồn gốc (Data Lineage):"
          description="Danh sách các file/lô dữ liệu đầu vào đã được phê duyệt và sử dụng để tổng hợp thành số liệu báo cáo này."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {batches.length === 0 ? (
          <Empty description="Chưa có dữ liệu nguồn hoặc đợt tổng hợp tự động tạo từ hệ thống" />
        ) : (
          <Table
            columns={columns}
            dataSource={batches}
            rowKey="batchId"
            pagination={false}
            size="small"
          />
        )}
      </Spin>
    </Drawer>
  );
};
