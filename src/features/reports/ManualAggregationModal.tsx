import React from 'react';
import { Modal, Table, Tag, Typography, Alert } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ImportBatch } from '@/types';

const { Text } = Typography;

interface ManualAggregationModalProps {
  open: boolean;
  batches: ImportBatch[];
  selectedBatchIds: string[];
  loading: boolean;
  submitting: boolean;
  onCancel: () => void;
  onSelectionChange: (ids: string[]) => void;
  onSubmit: () => Promise<void>;
}

export const ManualAggregationModal: React.FC<ManualAggregationModalProps> = ({
  open,
  batches,
  selectedBatchIds,
  loading,
  submitting,
  onCancel,
  onSelectionChange,
  onSubmit,
}) => {
  const columns: ColumnsType<ImportBatch> = [
    {
      title: 'Mã Lô',
      key: 'batchCode',
      width: 140,
      render: (_, r) => {
        const code = r.batchCode || r.id;
        return <Text code copyable={{ text: code }}>{code ? `${code.substring(0, 8)}...` : '-'}</Text>;
      },
    },
    {
      title: 'Tên Tệp Đã Import',
      dataIndex: 'fileName',
      key: 'fileName',
      render: (f) => <Text strong>{f}</Text>,
    },
    {
      title: 'Số Dòng Hợp Lệ',
      dataIndex: 'validRows',
      key: 'validRows',
      width: 140,
      render: (v) => <Tag color="green">{v?.toLocaleString() || 0} dòng</Tag>,
    },
    {
      title: 'Thời Gian Upload',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (d) => (d ? new Date(d).toLocaleString('vi-VN') : '-'),
    },
  ];

  return (
    <Modal
      title="Tổng Hợp Thủ Công (Chọn Các Lô Đã Duyệt)"
      open={open}
      onCancel={onCancel}
      onOk={onSubmit}
      confirmLoading={submitting}
      okText="Thực Hiện Tổng Hợp"
      cancelText="Hủy"
      width={750}
    >
      <Alert
        message="Chọn các lô nguồn dữ liệu:"
        description="Chỉ những lô dữ liệu đã được Checker phê duyệt (APPROVED) trong kỳ mới hiển thị tại đây để tổng hợp."
        type="info"
        showIcon
        style={{ margin: '12px 0 16px' }}
      />
      <Table
        columns={columns}
        dataSource={batches}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 5 }}
        size="small"
        rowSelection={{
          type: 'checkbox',
          selectedRowKeys: selectedBatchIds,
          onChange: (keys) => onSelectionChange(keys as string[]),
        }}
      />
    </Modal>
  );
};
