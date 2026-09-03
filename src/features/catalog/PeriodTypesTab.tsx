import React from 'react';
import { Table, Tag, Typography, Space, Tooltip } from 'antd';
import { ClockCircleOutlined, CalendarOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { DataPeriodType } from '@/types';

const { Text } = Typography;

interface PeriodTypesTabProps {
  periodTypes: DataPeriodType[];
  loading: boolean;
}

// Helper descriptions & presets matching QD 573 / TT15
const PERIOD_METADATA: Record<
  string,
  {
    frequency: string;
    cutoff: string;
    autoEtl: string;
    templates: string[];
    dayType: 'NGAY_LAM_VIEC' | 'NGAY_LICH';
  }
> = {
  '3ngay': {
    frequency: 'Định kỳ 3 ngày / lần',
    cutoff: 'Ngày thứ 3 của chu kỳ',
    autoEtl: '02:00 ngày T+1 sau chốt',
    templates: ['D10', 'D11', 'D12'],
    dayType: 'NGAY_LAM_VIEC',
  },
  '15NGAY': {
    frequency: 'Bán nguyệt (15 ngày)',
    cutoff: 'Ngày 15 và ngày cuối tháng',
    autoEtl: 'Ngày 16 & ngày 01 tháng sau',
    templates: ['D31', 'D32', 'D33', 'D34', 'D35'],
    dayType: 'NGAY_LICH',
  },
  'THANG': {
    frequency: 'Định kỳ Hàng tháng',
    cutoff: 'Ngày cuối cùng của tháng',
    autoEtl: 'Ngày 01 tháng kế tiếp',
    templates: ['D20', 'D40', 'D50', 'D60', 'D70'],
    dayType: 'NGAY_LICH',
  },
  'QUY': {
    frequency: 'Định kỳ Hàng quý (3 tháng)',
    cutoff: 'Ngày cuối cùng của quý',
    autoEtl: 'Ngày 05 đầu quý kế tiếp',
    templates: ['Báo cáo Quý (Tài chính)'],
    dayType: 'NGAY_LICH',
  },
  'NAM': {
    frequency: 'Định kỳ Hàng năm',
    cutoff: 'Ngày 31/12 hàng năm',
    autoEtl: 'Ngày 15/01 năm kế tiếp',
    templates: ['Báo cáo Thường Niên'],
    dayType: 'NGAY_LICH',
  },
  'EVENT': {
    frequency: 'Theo phát sinh sự kiện',
    cutoff: 'Trong vòng 24h khi có sự kiện',
    autoEtl: 'Ngay khi duyệt lô dữ liệu',
    templates: ['Báo cáo Đột xuất'],
    dayType: 'NGAY_LAM_VIEC',
  },
};

export const PeriodTypesTab: React.FC<PeriodTypesTabProps> = ({ periodTypes, loading }) => {
  const columns: ColumnsType<DataPeriodType> = [
    {
      title: 'Mã Loại Kỳ',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (c) => <Text code strong style={{ color: '#003B95' }}>{c}</Text>,
    },
    {
      title: 'Tên Loại Kỳ Báo Cáo',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (n, r) => {
        const meta = PERIOD_METADATA[r.code];
        return (
          <div>
            <Text strong>{n}</Text>
            {meta && (
              <div style={{ fontSize: 12, color: '#64748B' }}>
                <ClockCircleOutlined style={{ marginRight: 4 }} />
                {meta.frequency}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Ngày Chốt Số Liệu Báo Cáo',
      key: 'cutoff',
      width: 210,
      render: (_, r) => {
        const text = r.reportingDayDisplay || PERIOD_METADATA[r.code]?.cutoff || 'Theo cấu hình';
        return (
          <Space>
            <CalendarOutlined style={{ color: '#003B95' }} />
            <Text>{text}</Text>
          </Space>
        );
      },
    },
    {
      title: 'Thời Điểm Tổng Hợp Tự Động',
      key: 'autoEtl',
      width: 210,
      render: (_, r) => {
        const text = r.autoAggregationDayDisplay || PERIOD_METADATA[r.code]?.autoEtl || 'Theo lịch trình Cron';
        return (
          <Tag color="cyan" style={{ fontSize: 12 }}>
            {text}
          </Tag>
        );
      },
    },
    {
      title: 'Loại Ngày Tính Toán',
      key: 'dayType',
      width: 160,
      render: (_, r) => {
        const type = r.dayType || PERIOD_METADATA[r.code]?.dayType || 'NGAY_LICH';
        if (type === 'NGAY_LAM_VIEC') {
          return <Tag color="green">Ngày làm việc (Business)</Tag>;
        }
        return <Tag color="blue">Ngày lịch (Calendar)</Tag>;
      },
    },
    {
      title: 'Biểu Mẫu Áp Dụng (QĐ 573)',
      key: 'templates',
      render: (_, r) => {
        const tpls = r.applicableTemplates
          ? r.applicableTemplates.split(',')
          : PERIOD_METADATA[r.code]?.templates || [];
        return (
          <Space wrap size={[4, 4]}>
            {tpls.map((t) => (
              <Tag key={t} color="geekblue" style={{ fontWeight: 500 }}>
                {t.trim()}
              </Tag>
            ))}
          </Space>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={periodTypes}
      rowKey="code"
      loading={loading}
      pagination={false}
      size="middle"
    />
  );
};
