import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Tag, Space, Button, Input, Drawer, Statistic, Row, Col, Alert, Empty } from 'antd';
import { DatabaseOutlined, ReloadOutlined, EyeOutlined, SearchOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { importApi } from '@/api/import.api';

const { Text } = Typography;

interface TempoTableSummary {
  tableName: string;
  rowCount: number;
}

export const TempoStagingTablesView: React.FC = () => {
  const [tables, setTables] = useState<TempoTableSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Preview Drawer
  const [previewDrawerOpen, setPreviewDrawerOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      setLoading(true);
      const data = await importApi.getTempoTables();
      setTables(data || []);
    } catch (err) {
      console.error('Failed to load tempo tables:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPreview = async (tableName: string) => {
    setSelectedTable(tableName);
    setPreviewDrawerOpen(true);
    try {
      setPreviewLoading(true);
      const data = await importApi.previewTempoTable({ tableName, limit: 100 });
      setPreviewData(data || []);
    } catch (err) {
      console.error('Failed to preview tempo table:', err);
      setPreviewData([]);
    } finally {
      setPreviewLoading(false);
    }
  };

  const filteredTables = tables.filter((t) =>
    t.tableName.toLowerCase().includes(searchText.toLowerCase())
  );

  const totalRows = tables.reduce((acc, t) => acc + (t.rowCount || 0), 0);
  const activeTablesCount = tables.filter((t) => (t.rowCount || 0) > 0).length;

  const getReportBadge = (tableName: string) => {
    const lower = tableName.toLowerCase();
    if (lower.includes('_d10_')) return <Tag color="blue">Biểu Mẫu D10</Tag>;
    if (lower.includes('_d31_')) return <Tag color="green">Biểu Mẫu D31</Tag>;
    if (lower.includes('_d15_')) return <Tag color="gold">Biểu Mẫu D15</Tag>;
    if (lower.includes('_d41_')) return <Tag color="purple">Biểu Mẫu D41</Tag>;
    return <Tag color="default">Chung</Tag>;
  };

  const columns: ColumnsType<TempoTableSummary> = [
    {
      title: 'Tên Bảng Staging (PostgreSQL)',
      dataIndex: 'tableName',
      key: 'tableName',
      render: (t: string) => (
        <Space>
          <DatabaseOutlined style={{ color: '#722ED1', fontSize: 16 }} />
          <Text code strong style={{ fontSize: 13, color: '#1E293B' }}>
            {t}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Phân Hệ Báo Cáo',
      key: 'reportType',
      width: 160,
      render: (_, r) => getReportBadge(r.tableName),
    },
    {
      title: 'Số Dòng Dữ Liệu',
      dataIndex: 'rowCount',
      key: 'rowCount',
      width: 180,
      sorter: (a, b) => a.rowCount - b.rowCount,
      render: (count: number) => {
        if (count > 0) {
          return (
            <Tag color="success" style={{ fontWeight: 600, fontSize: 12 }}>
              {count.toLocaleString()} dòng
            </Tag>
          );
        }
        return <Text type="secondary">0 dòng (Sẵn sàng)</Text>;
      },
    },
    {
      title: 'Thao Tác',
      key: 'actions',
      width: 140,
      render: (_, r) => (
        <Button
          type="primary"
          ghost
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleOpenPreview(r.tableName)}
        >
          Xem Dữ Liệu
        </Button>
      ),
    },
  ];

  // Dynamic columns for preview drawer table
  const previewColumns: ColumnsType<any> = previewData.length > 0
    ? Object.keys(previewData[0]).map((key) => ({
        title: key,
        dataIndex: key,
        key: key,
        width: 140,
        ellipsis: true,
        render: (v: any) => (v !== null && v !== undefined && v !== '' ? String(v) : <Text type="secondary">-</Text>),
      }))
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Alert
        message="Nguồn Dữ Liệu Trực Tiếp Từ BI Pipeline (Bảng Staging tempo_***)"
        description="Đội BI thực hiện ETL dữ liệu khối lượng lớn trực tiếp vào các bảng quan hệ PostgreSQL có tiền tố tempo_***. Động cơ báo cáo RegOne đọc trực tiếp các bảng này để phục vụ Tổng hợp, Đối soát và Xuất báo cáo XML/ZIP nộp CIC."
        type="info"
        showIcon
        icon={<DatabaseOutlined style={{ color: '#1E63FF' }} />}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 8, borderColor: '#1E63FF' }}>
            <Statistic
              title="Tổng Số Bảng Staging BI"
              value={tables.length}
              suffix="bảng"
              prefix={<DatabaseOutlined style={{ color: '#1E63FF' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 8, borderColor: '#10B981' }}>
            <Statistic
              title="Bảng Đã Có Dữ Liệu Nạp"
              value={activeTablesCount}
              suffix={`/ ${tables.length} bảng`}
              valueStyle={{ color: '#10B981' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 8, borderColor: '#722ED1' }}>
            <Statistic
              title="Tổng Số Bản Ghi Đã Nạp"
              value={totalRows}
              suffix="dòng"
              valueStyle={{ color: '#722ED1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <DatabaseOutlined style={{ color: '#1E63FF' }} />
            <span>Danh Sách Bảng Dữ Liệu Staging BI (tempo_***)</span>
          </Space>
        }
        extra={
          <Space>
            <Input
              placeholder="Tìm kiếm bảng..."
              prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 220 }}
              allowClear
            />
            <Button icon={<ReloadOutlined />} onClick={loadTables} loading={loading}>
              Làm Mới
            </Button>
          </Space>
        }
        styles={{ body: { padding: 0 } }}
      >
        <Table
          columns={columns}
          dataSource={filteredTables}
          rowKey="tableName"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `Tổng cộng ${t} bảng` }}
        />
      </Card>

      {/* Preview Drawer */}
      <Drawer
        title={
          <Space>
            <DatabaseOutlined style={{ color: '#722ED1' }} />
            <span>Dữ Liệu Bảng: </span>
            <Text code strong style={{ color: '#003B95', fontSize: 14 }}>
              {selectedTable}
            </Text>
            <Tag color="success">{previewData.length} dòng xem trước</Tag>
          </Space>
        }
        open={previewDrawerOpen}
        onClose={() => setPreviewDrawerOpen(false)}
        width="80%"
        destroyOnClose
      >
        {previewData.length === 0 && !previewLoading ? (
          <Empty description="Bảng hiện chưa có dữ liệu hoặc đang chờ BI chạy ETL" />
        ) : (
          <Table
            columns={previewColumns}
            dataSource={previewData}
            rowKey={(r, idx) => String(r.PK_ID || r.TTC03 || idx)}
            loading={previewLoading}
            scroll={{ x: 'max-content', y: 550 }}
            pagination={{ pageSize: 20, showSizeChanger: true }}
            size="small"
            bordered
          />
        )}
      </Drawer>
    </div>
  );
};
