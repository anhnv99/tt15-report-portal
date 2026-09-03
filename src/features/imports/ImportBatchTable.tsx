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
  Tooltip,
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
import {
  Play,
  Check,
  X,
  Eye,
  UploadCloud,
  History,
} from 'lucide-react';
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
      title: 'Thao Tác',
      key: 'actions',
      width: 210,
      fixed: 'right' as const,
      render: (_, r) => (
        <Space size={6}>
          {r.status === 'UPLOADED' && (
            <Tooltip title="Chạy tiền xử lý dữ liệu (Staging)">
              <Button
                type="primary"
                shape="circle"
                size="small"
                icon={<Play size={14} />}
                style={{ background: '#003B95', borderColor: '#003B95', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => onStage(r.id)}
              />
            </Tooltip>
          )}

          {r.status === 'STAGED' && (
            <>
              <Tooltip title="Phê duyệt đợt dữ liệu này">
                <Popconfirm
                  title="Phê duyệt đợt dữ liệu này?"
                  description="Đợt dữ liệu được duyệt sẽ sẵn sàng để đưa vào module tổng hợp báo cáo."
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

              <Tooltip title="Từ chối đợt dữ liệu">
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

          <Tooltip title={`Xem chi tiết dữ liệu Staging (${(r.totalRows || 0).toLocaleString()} dòng)`}>
            <Button
              shape="circle"
              size="small"
              icon={<Eye size={14} />}
              onClick={() => onOpenStaging(r)}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            />
          </Tooltip>

          {onOpenSupplement && r.status !== 'REJECTED' && (
            <Tooltip title="Nạp bổ sung dữ liệu sửa lỗi">
              <Button
                shape="circle"
                size="small"
                icon={<UploadCloud size={14} />}
                style={{ color: '#D97706', borderColor: '#D97706', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => onOpenSupplement(r)}
              />
            </Tooltip>
          )}

          <Tooltip title="Xem lịch sử phê duyệt & timeline vết dữ liệu">
            <Button
              shape="circle"
              size="small"
              icon={<History size={14} />}
              onClick={() => onOpenTimeline(r.id)}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            />
          </Tooltip>
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
