import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Input,
  Row,
  Col,
  Drawer,
  Spin,
  Tooltip,
  Select,
  Alert,
  message,
} from 'antd';
import {
  DatabaseOutlined,
  EyeOutlined,
  SyncOutlined,
  SearchOutlined,
  TableOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { importApi } from '@/api/import.api';
import { biIntegrationApi, type CtlBiEtlStatusDto } from '@/api/bi-integration.api';
import type { DataPeriod } from '@/types';

const { Text, Title } = Typography;

interface TempoTableInfo {
  tableName: string;
  rowCount: number;
}

interface TempoStagingTabProps {
  periods?: DataPeriod[];
  onBatchCreated?: () => void;
}

export const TempoStagingTab: React.FC<TempoStagingTabProps> = ({ periods, onBatchCreated }) => {
  const [tables, setTables] = useState<TempoTableInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReportFilter, setSelectedReportFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // BI Sync State
  const [biStatuses, setBiStatuses] = useState<CtlBiEtlStatusDto[]>([]);
  const [selectedSyncPeriod, setSelectedSyncPeriod] = useState<number | undefined>(undefined);
  const [selectedSyncReport, setSelectedSyncReport] = useState<string>('D10');
  const [syncing, setSyncing] = useState<boolean>(false);

  // Preview Drawer
  const [previewDrawerOpen, setPreviewDrawerOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    loadTempoTables();
    loadBiStatuses();
  }, []);

  const loadTempoTables = async () => {
    try {
      setLoading(true);
      const data = await importApi.getTempoTables();
      setTables(data || []);
    } catch (err) {
      console.error('Error loading tempo tables:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBiStatuses = async () => {
    try {
      const data = await biIntegrationApi.getStatuses();
      setBiStatuses(data || []);
    } catch (err) {
      console.error('Error loading BI statuses:', err);
    }
  };

  const handleSyncNow = async () => {
    const kdlId = selectedSyncPeriod || (periods && periods.length > 0 ? periods[0].id : undefined);
    if (!kdlId) {
      message.warning('Vui lòng chọn kỳ dữ liệu để đồng bộ');
      return;
    }
    try {
      setSyncing(true);
      const res = await biIntegrationApi.syncNow(kdlId, selectedSyncReport);
      message.success(`Đã đồng bộ thành công dữ liệu từ BI! Lô đã được tạo và sẵn sàng cho Checker phê duyệt.`);
      loadTempoTables();
      loadBiStatuses();
      onBatchCreated?.();
    } catch (err: any) {
      console.error(err);
      message.error(err?.response?.data?.message || 'Không thể đồng bộ và tạo lô từ BI');
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenPreview = async (tableName: string) => {
    setSelectedTable(tableName);
    setPreviewDrawerOpen(true);
    try {
      setPreviewLoading(true);
      const rows = await importApi.previewTempoTable({ tableName, limit: 50 });
      setPreviewRows(rows || []);
    } catch (err) {
      console.error('Error previewing table:', err);
      setPreviewRows([]);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Derive human-readable description for BI Staging tables
  const getTableDescription = (tableName: string): { report: string; desc: string; color: string } => {
    const t = tableName.toLowerCase();
    if (t.includes('d10_kh_canhan')) return { report: 'D10', desc: 'Khách hàng cá nhân', color: 'blue' };
    if (t.includes('d10_kh_tochuc_nddpl')) return { report: 'D10', desc: 'Người đại diện pháp luật tổ chức (1-N)', color: 'geekblue' };
    if (t.includes('d10_kh_tochuc')) return { report: 'D10', desc: 'Khách hàng tổ chức (Doanh nghiệp)', color: 'blue' };
    if (t.includes('d31_chovay')) return { report: 'D31', desc: 'Hợp đồng tín dụng cho vay', color: 'green' };
    if (t.includes('d31_cv_kheuoc')) return { report: 'D31', desc: 'Khế ước nhận nợ cho vay (1-N)', color: 'cyan' };
    if (t.includes('d31_camketngb')) return { report: 'D31', desc: 'Cam kết ngoại bảng', color: 'green' };
    if (t.includes('d31_ctckngb')) return { report: 'D31', desc: 'Chi tiết cam kết ngoại bảng (1-N)', color: 'cyan' };
    if (t.includes('d31_noxlrr')) return { report: 'D31', desc: 'Nợ xử lý rủi ro', color: 'volcano' };
    if (t.includes('d31_duno')) return { report: 'D31', desc: 'Dư nợ xử lý rủi ro (1-N)', color: 'orange' };
    if (t.includes('d31_nhanut')) return { report: 'D31', desc: 'Nhận ủy thác', color: 'purple' };
    if (t.includes('d31_ut_kheuoc')) return { report: 'D31', desc: 'Khế ước ủy thác (1-N)', color: 'purple' };
    
    // Generic tempo table
    const parts = t.split('_');
    const rep = parts.length > 1 ? parts[1].toUpperCase() : 'BI';
    return { report: rep, desc: `Bảng staging BI ${tableName}`, color: 'default' };
  };

  const filteredTables = tables.filter((item) => {
    const info = getTableDescription(item.tableName);
    if (selectedReportFilter !== 'ALL' && info.report !== selectedReportFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.tableName.toLowerCase().includes(q) || info.desc.toLowerCase().includes(q);
    }
    return true;
  });

  const totalRowsInStaging = tables.reduce((acc, t) => acc + (t.rowCount || 0), 0);

  const columns: ColumnsType<TempoTableInfo> = [
    {
      title: 'Mẫu Báo Cáo',
      key: 'report',
      width: 120,
      render: (_, r) => {
        const info = getTableDescription(r.tableName);
        return <Tag color={info.color} style={{ fontWeight: 600 }}>{info.report}</Tag>;
      },
    },
    {
      title: 'Tên Bảng Staging BI (PostgreSQL)',
      dataIndex: 'tableName',
      key: 'tableName',
      width: 280,
      render: (t) => (
        <Space>
          <DatabaseOutlined style={{ color: '#003B95', fontSize: 16 }} />
          <Text code strong style={{ color: '#0F172A', fontSize: 13 }}>{t}</Text>
        </Space>
      ),
    },
    {
      title: 'Ý Nghĩa Nghiệp Vụ / Phân Đoạn',
      key: 'desc',
      render: (_, r) => {
        const info = getTableDescription(r.tableName);
        return <Text strong>{info.desc}</Text>;
      },
    },
    {
      title: 'Số Dòng Bản Ghi',
      dataIndex: 'rowCount',
      key: 'rowCount',
      width: 160,
      render: (c) => (
        c > 0 ? (
          <Tag color="green" style={{ fontSize: 13, padding: '2px 10px' }}>
            <b>{c.toLocaleString()}</b> dòng
          </Tag>
        ) : (
          <Tag color="default">0 dòng</Tag>
        )
      ),
    },
    {
      title: 'Thao Tác',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_, r) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          style={{ color: '#003B95', fontWeight: 500 }}
          onClick={() => handleOpenPreview(r.tableName)}
        >
          Xem Dữ Liệu
        </Button>
      ),
    },
  ];

  // Dynamic preview table columns
  const previewColumns: ColumnsType<any> = previewRows.length > 0
    ? Object.keys(previewRows[0]).map((key) => ({
        title: key.toUpperCase(),
        dataIndex: key,
        key,
        ellipsis: true,
        width: 140,
        render: (val: any) => (val !== null && val !== undefined ? String(val) : '-'),
      }))
    : [];

  return (
    <div>
      <Alert
        message="Chuẩn Hóa Nạp Dữ Liệu Tự Động (Single Source of Truth - SSoT)"
        description="Đội BI nạp dữ liệu trực tiếp vào 17 bảng staging PostgreSQL theo cặp (kdl_id, version). Hệ thống tự động phân tích và lắp ráp báo cáo chính thức từ các bảng này mà không cần upload file thủ công."
        type="info"
        showIcon
        style={{ marginBottom: 16, borderRadius: 8 }}
      />

      {/* BI Sync & Auto-Batch Trigger Card */}
      <Card
        style={{ marginBottom: 16, borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0' }}
        bodyStyle={{ padding: '12px 16px' }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 12]}>
          <Col xs={24} lg={13}>
            <Space direction="vertical" size={2}>
              <Space>
                <DatabaseOutlined style={{ color: '#722ED1', fontSize: 16 }} />
                <Text strong style={{ color: '#1E293B', fontSize: 14 }}>
                  Tích Hợp Đồng Bộ BI DWH (Auto-Batch & Checker Approval)
                </Text>
                {biStatuses.length > 0 && (
                  <Tag color="purple" style={{ fontSize: 11 }}>
                    {biStatuses.filter(s => s.status === 'BATCH_CREATED').length} Lô Đã Tạo
                  </Tag>
                )}
              </Space>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Khi BI hoàn tất ETL, hệ thống tự động sinh Lô dữ liệu (PROCESSED) cho Checker vào phê duyệt trước khi tổng hợp.
              </Text>
            </Space>
          </Col>
          <Col xs={24} lg={11} style={{ textAlign: 'right' }}>
            <Space wrap>
              {periods && periods.length > 0 && (
                <Select
                  value={selectedSyncPeriod || periods[0]?.id}
                  onChange={setSelectedSyncPeriod}
                  style={{ width: 170, textAlign: 'left' }}
                  placeholder="Chọn kỳ dữ liệu"
                  options={periods.map((p) => ({ label: p.name, value: p.id }))}
                />
              )}
              <Select
                value={selectedSyncReport}
                onChange={setSelectedSyncReport}
                style={{ width: 110, textAlign: 'left' }}
                options={[
                  { label: 'Mẫu D10', value: 'D10' },
                  { label: 'Mẫu D31', value: 'D31' },
                ]}
              />
              <Button
                type="primary"
                icon={<SyncOutlined spin={syncing} />}
                loading={syncing}
                style={{ background: '#722ED1', borderColor: '#722ED1' }}
                onClick={handleSyncNow}
              >
                Tạo Lô Duyệt Từ BI
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }} gutter={[16, 16]}>
        <Col xs={24} md={14}>
          <Space wrap>
            <Text strong>Lọc Theo Mẫu Báo Cáo:</Text>
            <Select
              value={selectedReportFilter}
              onChange={setSelectedReportFilter}
              style={{ width: 160 }}
              options={[
                { label: 'Tất Cả Mẫu', value: 'ALL' },
                { label: 'Báo Cáo D10', value: 'D10' },
                { label: 'Báo Cáo D31', value: 'D31' },
                { label: 'Báo Cáo D40', value: 'D40' },
              ]}
            />
            <Input
              placeholder="Tìm bảng staging..."
              prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: 220 }}
              allowClear
            />
          </Space>
        </Col>
        <Col xs={24} md={10} style={{ textAlign: 'right' }}>
          <Space>
            <Tag color="geekblue" style={{ fontSize: 13, padding: '4px 12px' }}>
              Tổng: <b>{totalRowsInStaging.toLocaleString()}</b> bản ghi staging
            </Tag>
            <Button icon={<SyncOutlined />} onClick={loadTempoTables} loading={loading}>
              Làm Mới
            </Button>
          </Space>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={filteredTables}
        rowKey="tableName"
        loading={loading}
        pagination={{ pageSize: 17 }}
        size="middle"
      />

      {/* Preview Staging Drawer */}
      <Drawer
        title={
          <Space>
            <TableOutlined style={{ color: '#003B95' }} />
            <span>Xem Trước Dữ Liệu Bảng: <Text code strong>{selectedTable}</Text></span>
          </Space>
        }
        placement="bottom"
        height="70%"
        open={previewDrawerOpen}
        onClose={() => setPreviewDrawerOpen(false)}
      >
        <Spin spinning={previewLoading}>
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary">
              Hiển thị tối đa 50 bản ghi mới nhất từ bảng staging <Text code>{selectedTable}</Text>:
            </Text>
          </div>
          <Table
            columns={previewColumns}
            dataSource={previewRows}
            rowKey={(r, idx) => r.pk_id || idx || Math.random()}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
            size="small"
          />
        </Spin>
      </Drawer>
    </div>
  );
};