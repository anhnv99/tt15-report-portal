import React from 'react';
import { Card, Table, Tag, Button, Space, Typography } from 'antd';
import { SettingOutlined, CodeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { ReportTemplate } from '@/types';

const { Text } = Typography;

interface TemplateListViewProps {
  templates: ReportTemplate[];
  loading: boolean;
  onOpenDetail: (tpl: ReportTemplate) => void;
  onViewJson: (reportCode: string) => void;
}

export const TemplateListView: React.FC<TemplateListViewProps> = ({
  templates,
  loading,
  onOpenDetail,
  onViewJson,
}) => {
  const columns: ColumnsType<ReportTemplate> = [
    {
      title: 'Mã Báo Cáo',
      dataIndex: 'reportCode',
      key: 'reportCode',
      width: 110,
      render: (c) => <Text strong style={{ color: '#003B95', fontSize: 14 }}>{c}</Text>,
    },
    {
      title: 'Mẫu Số',
      dataIndex: 'templateNumber',
      key: 'templateNumber',
      width: 100,
      render: (num) => <Tag color="blue">Mẫu {num || '01'}</Tag>,
    },
    {
      title: 'Tên Biểu Mẫu Báo Cáo',
      dataIndex: 'reportName',
      key: 'reportName',
      render: (n, r) => (
        <div>
          <Text strong>{n}</Text>
          {r.sourceReference && (
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
              {r.sourceReference}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Chu Kỳ Báo Cáo',
      dataIndex: 'frequency',
      key: 'frequency',
      width: 140,
      render: (f) => {
        const mapFreq: Record<string, { label: string; color: string }> = {
          EVENT: { label: 'Phát sinh', color: 'purple' },
          EVERY_3_WORKING_DAYS: { label: '3 ngày', color: 'cyan' },
          SEMI_MONTHLY: { label: 'Bán nguyệt (15 ngày)', color: 'orange' },
          MONTHLY: { label: 'Hàng tháng', color: 'green' },
          ANNUAL: { label: 'Hàng năm', color: 'gold' },
        };
        const item = mapFreq[f] || { label: f, color: 'default' };
        return <Tag color={item.color}>{item.label}</Tag>;
      },
    },
    {
      title: 'Tiền Tố File',
      dataIndex: 'filePrefix',
      key: 'filePrefix',
      width: 110,
      render: (p) => <Text code>{p || '-'}</Text>,
    },
    {
      title: 'Thao Tác',
      key: 'actions',
      width: 220,
      render: (_, r) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<SettingOutlined />}
            style={{ background: '#003B95' }}
            onClick={() => onOpenDetail(r)}
          >
            Cấu Hình & Rules
          </Button>
          <Button
            size="small"
            icon={<CodeOutlined />}
            onClick={() => onViewJson(r.reportCode)}
          >
            Xem JSON
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card style={{ borderRadius: 8 }} bodyStyle={{ padding: '16px 24px' }}>
      <Table
        columns={columns}
        dataSource={templates}
        rowKey="reportCode"
        loading={loading}
        pagination={{ pageSize: 15 }}
      />
    </Card>
  );
};
