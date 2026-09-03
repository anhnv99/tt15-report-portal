import React, { useState } from 'react';
import {
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Popconfirm,
  Progress,
  Card,
  Row,
  Col,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  HistoryOutlined,
  PlayCircleOutlined,
  FileExcelOutlined,
  SafetyCertificateOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { ImportBatch } from '@/types';

const { Text } = Typography;

interface ImportBatchTableProps {
  batches: ImportBatch[];
  loading: boolean;
  onStage: (batchId: string) => Promise<void>;
  onApprove: (batchId: string) => Promise<void>;
  onOpenReject: (batchId: string) => void;
  onOpenStaging: (batch: ImportBatch) => void;
  onOpenTimeline: (batchId: string) => void;
  onBulkApprove?: (batchIds: string[]) => Promise<void>;
  onOpenSupplement?: (batch: ImportBatch) => void;
}

export const ImportBatchTable: React.FC<ImportBatchTableProps> = ({
  batches,
  loading,
  onStage,
  onApprove,
  onOpenReject,
  onOpenStaging,
  onOpenTimeline,
  onBulkApprove,
  onOpenSupplement,
}) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'STAGED':
        return 'processing';
      case 'REJECTED':
        return 'error';
      case 'UPLOADED':
      case 'PENDING':
      default:
        return 'warning';
    }
  };

  const handleBulkApproveClick = async () => {
    if (onBulkApprove && selectedRowKeys.length > 0) {
      await onBulkApprove(selectedRowKeys as string[]);
      setSelectedRowKeys([]);
    }
  };

  const columns: ColumnsType<ImportBatch> = [
    {
      title: 'Mã Đợt',
      key: 'batchCode',
      width: 140,
      render: (_, r) => {
        const displayCode = r.batchCode || (r.id ? `BATCH-${r.id.substring(0, 8).toUpperCase()}` : 'BATCH');
        return <Text code strong style={{ color: '#003B95' }}>{displayCode}</Text>;
      },
    },
    {
      title: 'Tên Tệp Dữ Liệu',
      dataIndex: 'fileName',
      key: 'fileName',
      width: 280,
      render: (f, r) => (
        <div>
          <Space>
            <FileExcelOutlined style={{ color: '#10B981', fontSize: 16 }} />
            <Text strong>{f || r.originalFileName || 'Tệp Dữ Liệu'}</Text>
          </Space>
          {r.dataPeriodCode && (
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
              Kỳ: <Tag color="geekblue" style={{ fontSize: 11 }}>{r.dataPeriodCode}</Tag>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Loại Báo Cáo',
      dataIndex: 'importType',
      key: 'importType',
      width: 110,
      render: (t) => <Tag color="blue" style={{ fontWeight: 600 }}>{t}</Tag>,
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (s: string) => <Tag color={getStatusColor(s)}>{s}</Tag>,
    },
    {
      title: 'Chất Lượng Dữ Liệu (Data Health)',
      key: 'quality',
      width: 230,
      render: (_, r) => {
        const total = r.totalRows || 0;
        const valid = r.validRows || 0;
        const error = r.errorRows || 0;

        if (total === 0) {
          if (r.status === 'APPROVED') {
            return <Tag color="green">Đã duyệt (Lô mẫu)</Tag>;
          }
          if (r.status === 'UPLOADED') {
            return <Tag color="orange">Chờ tiền xử lý (Stage)</Tag>;
          }
          return <Text type="secondary">Chưa có dữ liệu dòng</Text>;
        }

        const percent = Math.round((valid / total) * 100);

        return (
          <div style={{ width: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
              <span>
                <b style={{ color: '#10B981' }}>{valid.toLocaleString()}</b> / {total.toLocaleString()} dòng
              </span>
              {error > 0 ? (
                <span style={{ color: '#EF4444', fontWeight: 600 }}>{error} lỗi</span>
              ) : (
                <span style={{ color: '#10B981' }}>100% hợp lệ</span>
              )}
            </div>
            <Progress
              percent={percent}
              size="small"
              status={error > 0 ? 'exception' : 'success'}
              showInfo={false}
            />
          </div>
        );
      },
    },
    {
      title: 'Người Tải / Thời Điểm',
      key: 'uploader',
      width: 170,
      render: (_, r) => {
        const time = r.createdAt || (r as any).submittedAt;
        return (
          <div>
            <Text>{r.uploadedBy || (r as any).submittedBy || 'Maker'}</Text>
            <div style={{ fontSize: 12, color: '#64748B' }}>
              {time ? new Date(time).toLocaleString('vi-VN') : 'Hệ thống'}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Thao Tác Nghiệp Vụ',
      key: 'actions',
      width: 320,
      fixed: 'right' as const,
      render: (_, r) => (
        <Space size="small" wrap>
          {r.status === 'UPLOADED' && (
            <Button
              type="primary"
              size="small"
              icon={<PlayCircleOutlined />}
              style={{ background: '#003B95' }}
              onClick={() => onStage(r.id)}
            >
              Tiền Xử Lý (Stage)
            </Button>
          )}

          {r.status === 'STAGED' && (
            <>
              <Popconfirm
                title="Phê duyệt đợt dữ liệu này?"
                description="Đợt dữ liệu được duyệt sẽ sẵn sàng để đưa vào module tổng hợp báo cáo."
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

          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onOpenStaging(r)}
          >
            {r.totalRows && r.totalRows > 0 ? `Dữ Liệu (${r.totalRows.toLocaleString()})` : 'Xem Dữ Liệu'}
          </Button>

          {onOpenSupplement && r.status !== 'REJECTED' && (
            <Button
              size="small"
              icon={<PlusCircleOutlined />}
              style={{ color: '#003B95', borderColor: '#003B95' }}
              onClick={() => onOpenSupplement(r)}
            >
              Bổ Sung
            </Button>
          )}

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
    <div>
      {/* Bulk Action Bar */}
      {selectedRowKeys.length > 0 && (
        <Card
          size="small"
          style={{ marginBottom: 16, background: '#EFF6FF', borderColor: '#BFDBFE', borderRadius: 8 }}
        >
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <SafetyCertificateOutlined style={{ color: '#003B95', fontSize: 16 }} />
                <Text strong style={{ color: '#1E40AF' }}>
                  Đã chọn {selectedRowKeys.length} lô dữ liệu
                </Text>
              </Space>
            </Col>
            <Col>
              <Space>
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  style={{ background: '#10B981' }}
                  onClick={handleBulkApproveClick}
                >
                  Phê Duyệt Hàng Loạt ({selectedRowKeys.length} Lô)
                </Button>
                <Button size="small" onClick={() => setSelectedRowKeys([])}>
                  Bỏ Chọn
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      <Table
        columns={columns}
        dataSource={batches}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1400 }}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
          getCheckboxProps: (record) => ({
            disabled: record.status !== 'STAGED', // Only STAGED batches can be approved
          }),
        }}
      />
    </div>
  );
};
