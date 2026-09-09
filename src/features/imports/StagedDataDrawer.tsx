import React, { useState, useEffect, useMemo } from 'react';
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
  Tabs,
  Card,
  Select,
  Input,
  Timeline,
  message,
} from 'antd';
import {
  DownloadOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  HistoryOutlined,
  TableOutlined,
  SyncOutlined,
  SearchOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { ImportBatch, StagingRow, ImportApprovalEvent, DataPeriod, ReportTemplate } from '@/types';
import { importApi } from '@/api/import.api';

const { Text } = Typography;

interface StagedDataDrawerProps {
  open: boolean;
  batch: ImportBatch | null;
  rows: StagingRow[];
  loading: boolean;
  onClose: () => void;
  periods?: DataPeriod[];
  templates?: ReportTemplate[];
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

export const formatFileSize = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const StagedDataDrawer: React.FC<StagedDataDrawerProps> = ({
  open,
  batch,
  rows,
  loading,
  onClose,
  periods,
  templates,
}) => {
  const [activeTab, setActiveTab] = useState<string>('data');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Tempo tables preview state (for ETL / SSoT batches)
  const [tempoTables, setTempoTables] = useState<{ tableName: string; rowCount: number }[]>([]);
  const [selectedTempoTable, setSelectedTempoTable] = useState<string>('');
  const [tempoRows, setTempoRows] = useState<any[]>([]);
  const [tempoLoading, setTempoLoading] = useState<boolean>(false);
  const [tempoSearch, setTempoSearch] = useState<string>('');

  // Batch events timeline state
  const [events, setEvents] = useState<ImportApprovalEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState<boolean>(false);

  // Load tempo tables and batch events when drawer opens
  useEffect(() => {
    if (open && batch) {
      loadBatchEvents(batch.id);
      loadMatchingTempoTables(batch.importType, batch.dataPeriodId);
    } else {
      setTempoTables([]);
      setSelectedTempoTable('');
      setTempoRows([]);
      setEvents([]);
      setFilterType('ALL');
      setActiveTab('data');
    }
  }, [open, batch?.id, batch?.importType, batch?.dataPeriodId]);

  const loadBatchEvents = async (batchId: string) => {
    try {
      setEventsLoading(true);
      const data = await importApi.getBatchEvents(batchId);
      setEvents(data || []);
    } catch (err) {
      console.error('Error loading batch events:', err);
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  const loadMatchingTempoTables = async (importType?: string, periodId?: number) => {
    if (!importType) return;
    try {
      setTempoLoading(true);
      const allTables = await importApi.getTempoTables();
      const code = importType.toLowerCase();
      const matched = (allTables || []).filter(
        (t) =>
          t.tableName.toLowerCase().startsWith(`tempo_${code}_`) ||
          t.tableName.toLowerCase().includes(code)
      );
      setTempoTables(matched);

      if (matched.length > 0) {
        const firstTable = matched[0].tableName;
        setSelectedTempoTable(firstTable);
        await loadTempoPreview(firstTable, periodId);
      } else {
        setSelectedTempoTable('');
        setTempoRows([]);
      }
    } catch (err) {
      console.error('Error loading tempo tables:', err);
    } finally {
      setTempoLoading(false);
    }
  };

  const loadTempoPreview = async (tableName: string, periodId?: number) => {
    if (!tableName) return;
    try {
      setTempoLoading(true);
      const data = await importApi.previewTempoTable({
        tableName,
        kdlId: periodId,
        limit: 100,
      });
      const mappedData = (data || []).map((r: any, idx: number) => ({
        _rowKey: r.pk_id ?? r.id ?? `tempo_${idx}`,
        ...r,
      }));
      setTempoRows(mappedData);
    } catch (err) {
      console.error('Error previewing tempo table:', err);
      setTempoRows([]);
    } finally {
      setTempoLoading(false);
    }
  };

  const handleTempoTableChange = (tableName: string) => {
    setSelectedTempoTable(tableName);
    loadTempoPreview(tableName, batch?.dataPeriodId);
  };

  // Counts for Excel rows
  const errorCount = useMemo(() => rows.filter(isRowError).length, [rows]);
  const validCount = useMemo(() => rows.length - errorCount, [rows, errorCount]);

  // Filtered Excel rows
  const filteredRows = useMemo(() => {
    if (filterType === 'ERROR') {
      return rows.filter(isRowError);
    }
    if (filterType === 'VALID') {
      return rows.filter((r) => !isRowError(r));
    }
    return rows;
  }, [rows, filterType]);

  // Filtered tempo rows
  const filteredTempoRows = useMemo(() => {
    if (!tempoSearch.trim()) return tempoRows;
    const q = tempoSearch.toLowerCase();
    return tempoRows.filter((r) =>
      Object.values(r).some((val) => String(val).toLowerCase().includes(q))
    );
  }, [tempoRows, tempoSearch]);

  // Dynamic preview table columns for tempo tables
  const dynamicTempoColumns: ColumnsType<any> = useMemo(() => {
    if (filteredTempoRows.length === 0) return [];
    return Object.keys(filteredTempoRows[0]).map((key) => ({
      title: key.toUpperCase(),
      dataIndex: key,
      key,
      ellipsis: true,
      width: 140,
      render: (val: any) => (val !== null && val !== undefined ? String(val) : '-'),
    }));
  }, [filteredTempoRows]);

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

  const getStatusTag = (status?: string) => {
    switch (status) {
      case 'APPROVED':
        return <Tag color="success">ĐÃ DUYỆT</Tag>;
      case 'PROCESSED':
        return <Tag color="cyan">CHỜ DUYỆT (ETL XONG)</Tag>;
      case 'PROCESSING':
        return <Tag color="processing">ĐANG CHẠY ETL</Tag>;
      case 'STAGED':
        return <Tag color="purple">ĐÃ TIỀN XỬ LÝ</Tag>;
      case 'RECEIVED':
      case 'UPLOADED':
        return <Tag color="warning">CHỜ TIỀN XỬ LÝ</Tag>;
      case 'FAILED':
        return <Tag color="error">LỖI ETL</Tag>;
      case 'REJECTED':
        return <Tag color="error">TỪ CHỐI</Tag>;
      default:
        return <Tag>{status || 'N/A'}</Tag>;
    }
  };

  const getActionColor = (eventType?: string) => {
    switch (eventType?.toUpperCase()) {
      case 'APPROVED':
        return 'green';
      case 'REJECTED':
        return 'red';
      case 'STAGED':
      case 'PROCESSED':
        return 'blue';
      case 'UPLOADED':
      case 'RECEIVED':
      default:
        return 'orange';
    }
  };

  const excelColumns: ColumnsType<StagingRow> = [
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

  // Resolve period and template labels
  const periodObj = periods?.find((p) => p.id === batch?.dataPeriodId);
  const periodDisplay = periodObj ? `${periodObj.name} (${periodObj.code})` : batch?.dataPeriodCode || (batch?.dataPeriodId ? `Kỳ ID: ${batch.dataPeriodId}` : 'N/A');
  const templateObj = templates?.find((t) => t.reportCode === batch?.importType);
  const isEtlChannel = batch?.sourceChannel === 'ETL' || (batch?.fileName && batch.fileName.toLowerCase().includes('etl')) || (batch?.fileName && batch.fileName.toLowerCase().includes('bi_sync'));

  return (
    <Drawer
      title={
        <Space>
          <FileTextOutlined style={{ color: '#003B95', fontSize: 18 }} />
          <span>
            Chi Tiết Lô Dữ Liệu: <Text strong style={{ color: '#003B95' }}>{batch?.batchCode || (batch?.id ? `BATCH-${batch.id.substring(0, 8).toUpperCase()}` : 'N/A')}</Text>
          </span>
          {batch && getStatusTag(batch.status)}
        </Space>
      }
      placement="right"
      size={1050}
      onClose={onClose}
      open={open}
      extra={
        errorCount > 0 && rows.length > 0 && (
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
        {/* Batch Overview Card */}
        {batch && (
          <Card
            size="small"
            style={{ marginBottom: 16, borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0' }}
          >
            <Descriptions size="small" column={{ xs: 1, sm: 2, md: 3 }} bordered>
              <Descriptions.Item label="Mã Đợt (Batch Code)">
                <Text code copyable>{batch.batchCode || batch.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Tên Tệp Nguồn">
                <Space>
                  {isEtlChannel ? (
                    <DatabaseOutlined style={{ color: '#722ED1' }} />
                  ) : (
                    <FileExcelOutlined style={{ color: '#10B981' }} />
                  )}
                  <Text strong>{batch.fileName || batch.originalFileName || 'Tệp dữ liệu'}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Kênh Tiếp Nhận">
                {isEtlChannel ? (
                  <Tag color="purple">BI ETL Pipeline (DWH SSoT)</Tag>
                ) : (
                  <Tag color="green">File Excel Upload (Maker/Checker)</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Biểu Mẫu Báo Cáo">
                <Tag color="blue" style={{ fontWeight: 600 }}>{batch.importType}</Tag>
                <Text style={{ fontSize: 12, color: '#475569' }}>{templateObj?.reportName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Kỳ Dữ Liệu">
                <Tag color="geekblue">{periodDisplay}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng Thái Lô">
                {getStatusTag(batch.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Dung Lượng Tệp">
                <Text>{formatFileSize(batch.fileSize)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Người Nạp / Hệ Thống">
                <Text>{batch.submittedBy || batch.uploadedBy || 'Maker'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Thời Điểm Tiếp Nhận">
                <Text>
                  {batch.submittedAt || batch.createdAt
                    ? new Date(batch.submittedAt || batch.createdAt!).toLocaleString('vi-VN')
                    : 'Hệ thống'}
                </Text>
              </Descriptions.Item>
            </Descriptions>

            {batch.rejectionReason && (
              <Alert
                type="error"
                showIcon
                message="Lý do từ chối / Lỗi ETL"
                description={batch.rejectionReason}
                style={{ marginTop: 12, borderRadius: 6 }}
              />
            )}
          </Card>
        )}

        {/* Main Tabs inside Drawer */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'data',
              label: (
                <Space>
                  <TableOutlined style={{ color: '#003B95' }} />
                  <span>Dữ Liệu Chi Tiết (Staged Data)</span>
                  {rows.length > 0 ? (
                    <Tag color="blue" style={{ margin: 0 }}>{rows.length} dòng</Tag>
                  ) : tempoRows.length > 0 ? (
                    <Tag color="purple" style={{ margin: 0 }}>{tempoRows.length} bản ghi</Tag>
                  ) : null}
                </Space>
              ),
              children: (
                <div>
                  {/* Case 1: Excel File Upload with Staged Rows */}
                  {rows.length > 0 && (
                    <div>
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
                          columns={excelColumns}
                          dataSource={filteredRows}
                          rowKey="rowNumber"
                          pagination={{ pageSize: 12, size: 'small' }}
                          size="small"
                        />
                      )}
                    </div>
                  )}

                  {/* Case 2: BI ETL Pipeline Staging Data (Tempo Tables SSoT) */}
                  {rows.length === 0 && tempoTables.length > 0 && (
                    <div>
                      <Alert
                        type="info"
                        showIcon
                        icon={<DatabaseOutlined style={{ color: '#722ED1' }} />}
                        message={
                          <Text strong style={{ color: '#1E293B' }}>
                            Dữ Liệu Bảng Staging BI (PostgreSQL)
                          </Text>
                        }
                        description={
                          <Text style={{ fontSize: 12, color: '#475569' }}>
                            Lô dữ liệu này được nạp tự động qua kênh <b>BI ETL Pipeline</b> trực tiếp vào các bảng chuyên biệt <b>tempo_{batch?.importType?.toLowerCase()}_*</b> theo kỳ dữ liệu. Dưới đây là dữ liệu xem trước trực tiếp từ database PostgreSQL:
                          </Text>
                        }
                        style={{ marginBottom: 16, borderRadius: 8, background: '#F5F3FF', borderColor: '#DDD6FE' }}
                      />

                      {/* Tempo Table Selector & Controls */}
                      <Row justify="space-between" align="middle" gutter={[12, 12]} style={{ marginBottom: 14 }}>
                        <Col xs={24} md={14}>
                          <Space wrap>
                            <Text strong style={{ fontSize: 13 }}>Chọn bảng phân đoạn:</Text>
                            <Select
                              value={selectedTempoTable}
                              onChange={handleTempoTableChange}
                              style={{ width: 280 }}
                              options={tempoTables.map((t) => ({
                                label: (
                                  <Space>
                                    <Text code>{t.tableName}</Text>
                                    <Tag color={t.rowCount > 0 ? 'green' : 'default'} style={{ fontSize: 11 }}>
                                      {t.rowCount} dòng
                                    </Tag>
                                  </Space>
                                ),
                                value: t.tableName,
                              }))}
                            />
                            <Button
                              icon={<SyncOutlined />}
                              size="small"
                              onClick={() => loadTempoPreview(selectedTempoTable, batch?.dataPeriodId)}
                              loading={tempoLoading}
                            >
                              Làm mới
                            </Button>
                          </Space>
                        </Col>
                        <Col xs={24} md={10} style={{ textAlign: 'right' }}>
                          <Input
                            placeholder="Tìm kiếm trong dữ liệu bảng..."
                            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                            value={tempoSearch}
                            onChange={(e) => setTempoSearch(e.target.value)}
                            style={{ width: 220 }}
                            size="small"
                            allowClear
                          />
                        </Col>
                      </Row>

                      <Spin spinning={tempoLoading}>
                        {dynamicTempoColumns.length === 0 ? (
                          <Empty description={`Bảng ${selectedTempoTable} chưa có bản ghi nào cho kỳ này`} />
                        ) : (
                          <Table
                            columns={dynamicTempoColumns}
                            dataSource={filteredTempoRows}
                            rowKey="_rowKey"
                            pagination={{ pageSize: 10, size: 'small' }}
                            scroll={{ x: 'max-content' }}
                            size="small"
                          />
                        )}
                      </Spin>
                    </div>
                  )}

                  {/* Case 3: Empty State (No rows and no matching tempo tables) */}
                  {rows.length === 0 && tempoTables.length === 0 && (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <Space orientation="vertical" size={4}>
                          <Text strong style={{ color: '#64748B' }}>Lô Dữ Liệu Chưa Có Bản Ghi Nào</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {batch?.status === 'RECEIVED' || batch?.status === 'UPLOADED'
                              ? 'Lô đang ở trạng thái chờ tiền xử lý. Vui lòng bấm nút "Tiền xử lý (Stage)" ở danh sách lô để hệ thống phân tích dữ liệu.'
                              : 'Không tìm thấy dòng dữ liệu staging cho đợt import này.'}
                          </Text>
                        </Space>
                      }
                    />
                  )}
                </div>
              ),
            },
            {
              key: 'timeline',
              label: (
                <Space>
                  <HistoryOutlined style={{ color: '#722ED1' }} />
                  <span>Lịch Sử Phê Duyệt & Vết Dữ Liệu</span>
                  {events.length > 0 && <Tag color="purple" style={{ margin: 0 }}>{events.length}</Tag>}
                </Space>
              ),
              children: (
                <Spin spinning={eventsLoading}>
                  {events.length === 0 ? (
                    <Empty description="Chưa có sự kiện nào được ghi nhận cho lô này" />
                  ) : (
                    <Timeline
                      mode="left"
                      style={{ marginTop: 12 }}
                      items={events.map((e) => {
                        const eventType = e.eventType || e.action || 'SỰ KIỆN';
                        const actor = e.actor || e.actorRef || 'Hệ thống';
                        const reason = e.reason || e.comment;
                        return {
                          color: getActionColor(eventType),
                          children: (
                            <Card size="small" style={{ marginBottom: 8, borderRadius: 6, maxWidth: 650 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <Tag color={getActionColor(eventType)} style={{ fontWeight: 600 }}>
                                  {eventType}
                                </Tag>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {e.occurredAt ? new Date(e.occurredAt).toLocaleString('vi-VN') : ''}
                                </Text>
                              </div>
                              <div>
                                <Text strong style={{ fontSize: 13 }}>Người thực hiện:</Text>{' '}
                                <Text code>{actor}</Text>
                              </div>
                              {reason && (
                                <div style={{ marginTop: 4, color: '#475569', fontSize: 12 }}>
                                  Ghi chú / Lý do: {reason}
                                </div>
                              )}
                            </Card>
                          ),
                        };
                      })}
                    />
                  )}
                </Spin>
              ),
            },
          ]}
        />
      </Spin>
    </Drawer>
  );
};
