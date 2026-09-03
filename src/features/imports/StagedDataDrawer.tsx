import React, { useState, useMemo } from 'react';
import {
  Drawer,
  Spin,
  Table,
  Tag,
  Typography,
  Alert,
  Descriptions,
  Segmented,
  Button,
  Space,
  Row,
  Col,
  Empty,
  message,
} from 'antd';
import {
  DownloadOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { ImportBatch, StagingRow } from '@/types';

const { Text } = Typography;

interface StagedDataDrawerProps {
  open: boolean;
  batch: ImportBatch | null;
  rows: StagingRow[];
  loading: boolean;
  onClose: () => void;
}

// Helper to reliably check if a staging row has real errors
export const isRowError = (r: StagingRow): boolean => {
  if (r.status === 'INVALID' || r.status === 'ERROR' || r.status === 'FAILED') return true;
  if (!r.errorJson) return false;
  if (r.errorJson === '[]' || r.errorJson === '{}' || r.errorJson === 'null') return false;
  if (typeof r.errorJson === 'string' && r.errorJson.trim() === '') return false;
  if (Array.isArray(r.errorJson) && r.errorJson.length === 0) return false;
  if (typeof r.errorJson === 'object' && Object.keys(r.errorJson).length === 0) return false;
  return true;
};

// Helper to format error details
export const formatErrorMessage = (errorJson: any): string | null => {
  if (!errorJson) return null;
  if (errorJson === '[]' || errorJson === '{}' || errorJson === 'null') return null;
  if (typeof errorJson === 'string' && errorJson.trim() === '') return null;

  try {
    const parsed = typeof errorJson === 'string' ? JSON.parse(errorJson) : errorJson;
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) return null;
      return parsed
        .map((e) =>
          typeof e === 'object'
            ? `${e.field || e.code || e.indicatorCode ? `[${e.field || e.code || e.indicatorCode}] ` : ''}${e.message || e.error || JSON.stringify(e)}`
            : String(e)
        )
        .join('; ');
    }
    if (typeof parsed === 'object') {
      const keys = Object.keys(parsed);
      if (keys.length === 0) return null;
      return keys.map((k) => `[${k}] ${parsed[k]}`).join('; ');
    }
    return String(parsed);
  } catch {
    return String(errorJson);
  }
};

export const StagedDataDrawer: React.FC<StagedDataDrawerProps> = ({
  open,
  batch,
  rows,
  loading,
  onClose,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  // Counts
  const errorCount = useMemo(() => rows.filter(isRowError).length, [rows]);
  const validCount = useMemo(() => rows.length - errorCount, [rows, errorCount]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    if (filterType === 'ERROR') {
      return rows.filter(isRowError);
    }
    if (filterType === 'VALID') {
      return rows.filter((r) => !isRowError(r));
    }
    return rows;
  }, [rows, filterType]);

  // Export Errors as CSV
  const handleExportErrorsCsv = () => {
    const errorRows = rows.filter(isRowError);
    if (!errorRows.length) {
      message.info('Không có dòng lỗi nào để xuất');
      return;
    }

    const headers = ['SO_DONG', 'TRANG_THAI', 'CHI_TIET_LOI', 'DU_LIEU_GOC'];
    const lines = errorRows.map((r) => [
      r.rowNumber,
      r.status,
      `"${(formatErrorMessage(r.errorJson) || r.status).replace(/"/g, '""')}"`,
      `"${(typeof r.payloadJson === 'object' ? JSON.stringify(r.payloadJson) : r.payloadJson || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...lines.map((l) => l.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Danh_sach_dong_loi_${batch?.batchCode || 'batch'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success(`Đã xuất file lỗi: Danh_sach_dong_loi_${batch?.batchCode || 'batch'}.csv`);
  };

  const columns: ColumnsType<StagingRow> = [
    {
      title: 'Số Dòng',
      dataIndex: 'rowNumber',
      key: 'rowNumber',
      width: 90,
      render: (n) => <Text strong style={{ color: '#003B95' }}>#{n}</Text>,
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (s: string, r) => {
        const hasErr = isRowError(r);
        if (hasErr) {
          return (
            <Tag color="error" icon={<CloseCircleOutlined />}>
              LỖI ({s})
            </Tag>
          );
        }
        return (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            HỢP LỆ
          </Tag>
        );
      },
    },
    {
      title: 'Chi Tiết Vi Phạm / Cảnh Báo Lỗi',
      dataIndex: 'errorJson',
      key: 'errorJson',
      width: 300,
      render: (e, r) => {
        const hasErr = isRowError(r);
        if (!hasErr) {
          return <Tag color="green">Đạt chuẩn quy tắc</Tag>;
        }
        const errorText = formatErrorMessage(e) || 'Dữ liệu không đạt quy chuẩn';
        return (
          <Alert
            type="error"
            showIcon
            message={<Text strong style={{ fontSize: 12 }}>Phát hiện lỗi dòng #{r.rowNumber}</Text>}
            description={<Text style={{ fontSize: 12, color: '#991B1B' }}>{errorText}</Text>}
            style={{ padding: '6px 10px', borderRadius: 6 }}
          />
        );
      },
    },
    {
      title: 'Dữ Liệu Đã Phân Tích (JSON Payload)',
      dataIndex: 'payloadJson',
      key: 'payloadJson',
      render: (p) => {
        let content = p;
        if (typeof p === 'object') {
          content = JSON.stringify(p, null, 2);
        } else if (typeof p === 'string') {
          try {
            content = JSON.stringify(JSON.parse(p), null, 2);
          } catch {
            content = p;
          }
        }
        return (
          <div
            style={{
              maxHeight: 110,
              overflowY: 'auto',
              background: '#F8FAFC',
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid #E2E8F0',
            }}
          >
            <Text code style={{ fontSize: 11, color: '#0F172A', whiteSpace: 'pre-wrap' }}>
              {content}
            </Text>
          </div>
        );
      },
    },
  ];

  return (
    <Drawer
      title={
        <Space>
          <FileTextOutlined style={{ color: '#003B95' }} />
          <span>
            Kiểm Tra Dữ Liệu Tiền Xử Lý (Staging): Lô {batch?.batchCode || (batch?.id ? `BATCH-${batch.id.substring(0, 8).toUpperCase()}` : '')} ({batch?.importType || ''})
          </span>
        </Space>
      }
      placement="right"
      width={950}
      onClose={onClose}
      open={open}
      extra={
        errorCount > 0 && (
          <Button
            type="primary"
            danger
            icon={<DownloadOutlined />}
            size="small"
            onClick={handleExportErrorsCsv}
          >
            Xuất File Dòng Lỗi ({errorCount})
          </Button>
        )
      }
    >
      <Spin spinning={loading}>
        {batch && (
          <Descriptions size="small" column={3} style={{ marginBottom: 16 }} bordered>
            <Descriptions.Item label="Tổng số dòng">{rows.length}</Descriptions.Item>
            <Descriptions.Item label="Hợp lệ">
              <Tag color="green">{validCount.toLocaleString()} dòng</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Lỗi / Vi phạm">
              <Tag color={errorCount > 0 ? 'red' : 'default'}>{errorCount.toLocaleString()} dòng</Tag>
            </Descriptions.Item>
          </Descriptions>
        )}

        {/* Filter Switcher */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Segmented
              value={filterType}
              onChange={(v) => setFilterType(v as string)}
              options={[
                { label: `Tất cả (${rows.length})`, value: 'ALL' },
                {
                  label: (
                    <Space>
                      <CloseCircleOutlined style={{ color: errorCount > 0 ? '#EF4444' : undefined }} />
                      <span style={{ color: errorCount > 0 ? '#EF4444' : undefined, fontWeight: errorCount > 0 ? 600 : 400 }}>
                        Dòng Lỗi Vi Phạm ({errorCount})
                      </span>
                    </Space>
                  ),
                  value: 'ERROR',
                },
                {
                  label: (
                    <Space>
                      <CheckCircleOutlined style={{ color: '#10B981' }} />
                      <span>Hợp Lệ ({validCount})</span>
                    </Space>
                  ),
                  value: 'VALID',
                },
              ]}
            />
          </Col>
          <Col>
            {errorCount > 0 && filterType === 'ERROR' && (
              <Text type="danger" style={{ fontSize: 12 }}>
                <WarningOutlined style={{ marginRight: 4 }} />
                Có {errorCount} dòng cần Maker chỉnh sửa lại file nguồn trước khi Checker duyệt.
              </Text>
            )}
            {errorCount === 0 && (
              <Text type="success" style={{ fontSize: 12 }}>
                <CheckCircleOutlined style={{ marginRight: 4 }} />
                Tất cả {rows.length} dòng đều hợp lệ, sẵn sàng để Checker phê duyệt!
              </Text>
            )}
          </Col>
        </Row>

        {filteredRows.length === 0 ? (
          <Empty description="Không có bản ghi nào phù hợp với bộ lọc" />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredRows}
            rowKey="rowNumber"
            pagination={{ pageSize: 12, size: 'small' }}
            size="small"
          />
        )}
      </Spin>
    </Drawer>
  );
};
