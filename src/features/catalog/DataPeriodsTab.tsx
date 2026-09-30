import React, { useMemo, useState } from 'react';
import { Table, Tag, Button, Typography, Popconfirm, Tooltip, Input, Select } from 'antd';
import { PlusOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Lock, Unlock } from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import type { DataPeriod } from '@/types';
import { OperationalFilterBar } from '@/components/OperationalFilterBar';

const { Text } = Typography;

interface DataPeriodsTabProps {
  periods: DataPeriod[];
  loading: boolean;
  onOpenCreate: () => void;
  onOpenGenerate: () => void;
  onToggleClose: (period: DataPeriod) => Promise<void>;
}

export const DataPeriodsTab: React.FC<DataPeriodsTabProps> = ({
  periods,
  loading,
  onOpenCreate,
  onOpenGenerate,
  onToggleClose,
}) => {
  const [searchText, setSearchText] = useState('');
  const [periodType, setPeriodType] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const periodTypeOptions = useMemo(
    () => [...new Set(periods.map((period) => period.periodType).filter(Boolean))]
      .sort()
      .map((value) => ({ value, label: value })),
    [periods],
  );
  const filteredPeriods = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return periods.filter((period) => {
      const matchesKeyword = !keyword || `${period.code} ${period.name}`.toLowerCase().includes(keyword);
      const matchesType = !periodType || period.periodType === periodType;
      const matchesStatus = !status || (status === 'OPEN' ? !period.closed : period.closed);
      return matchesKeyword && matchesType && matchesStatus;
    });
  }, [periods, periodType, searchText, status]);

  const columns: ColumnsType<DataPeriod> = [
    {
      title: 'Mã Kỳ',
      dataIndex: 'code',
      key: 'code',
      width: 140,
      render: (c) => <Text code strong style={{ color: '#003B95' }}>{c}</Text>,
    },
    {
      title: 'Tên Kỳ Dữ Liệu',
      dataIndex: 'name',
      key: 'name',
      width: 320,
      render: (n) => <Text strong>{n}</Text>,
    },
    {
      title: 'Loại Kỳ',
      dataIndex: 'periodType',
      key: 'periodType',
      width: 170,
      render: (t, r) => {
        let val = t || (r as any).periodTypeName;
        if (!val) {
          if (r.code.includes('_3D') || r.code.includes('3NGAY')) val = '3 Ngày';
          else if (r.code.includes('_15D') || r.code.includes('15NGAY')) val = 'Bán nguyệt (15 ngày)';
          else if (r.code.includes('EVENT')) val = 'Theo sự kiện';
          else val = 'Hàng tháng';
        }
        const colorMap: Record<string, string> = {
          '3 Ngày': 'cyan',
          'Theo sự kiện': 'purple',
          'Bán nguyệt (15 ngày)': 'orange',
          'Hàng tháng': 'green',
          'Hàng năm': 'gold',
          'Hàng quý': 'blue',
        };
        return <Tag color={colorMap[val] || 'blue'}>{val}</Tag>;
      },
    },
    {
      title: 'Từ Ngày',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
    },
    {
      title: 'Đến Ngày',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120,
    },
    {
      title: 'Hạn Nộp Báo Cáo',
      dataIndex: 'reportingDeadline',
      key: 'reportingDeadline',
      width: 140,
      render: (d) => (d ? <Text type="danger">{d}</Text> : '-'),
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'closed',
      key: 'closed',
      width: 120,
      render: (closed) => (
        <Tag color={closed ? 'error' : 'success'}>
          {closed ? 'ĐÃ ĐÓNG SỔ' : 'ĐANG MỞ'}
        </Tag>
      ),
    },
    {
      title: 'Thao Tác',
      key: 'actions',
      width: 100,
      render: (_, r) => (
        <Tooltip title={r.closed ? 'Mở lại sổ kỳ dữ liệu này' : 'Khóa sổ (Đóng kỳ) dữ liệu này'}>
          <Popconfirm
            title={r.closed ? 'Mở lại kỳ dữ liệu này?' : 'Đóng sổ kỳ dữ liệu này?'}
            description={
              r.closed
                ? 'Mở lại kỳ sẽ cho phép nạp thêm dữ liệu và tổng hợp lại báo cáo.'
                : 'Đóng kỳ sẽ khóa không cho phép nạp đè dữ liệu.'
            }
            onConfirm={() => onToggleClose(r)}
            okText={r.closed ? 'Mở Kỳ' : 'Đóng Sổ'}
            cancelText="Hủy"
          >
            <Button
              shape="circle"
              size="small"
              type={r.closed ? 'default' : 'primary'}
              danger={!r.closed}
              icon={r.closed ? <Unlock size={14} /> : <Lock size={14} />}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            />
          </Popconfirm>
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      <OperationalFilterBar
        filters={(
          <>
            <Input.Search allowClear placeholder="Tìm mã hoặc tên kỳ" value={searchText} onChange={(event) => setSearchText(event.target.value)} style={{ width: 240 }} />
            <Select allowClear placeholder="Loại kỳ" value={periodType} onChange={setPeriodType} options={periodTypeOptions} style={{ width: 160 }} />
            <Select allowClear placeholder="Trạng thái" value={status} onChange={setStatus} style={{ width: 150 }} options={[
              { value: 'OPEN', label: 'Đang mở' },
              { value: 'CLOSED', label: 'Đã đóng sổ' },
            ]} />
            <Text strong style={{ fontSize: 13 }}>Kết quả: {filteredPeriods.length}</Text>
          </>
        )}
        actions={(
          <>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ background: '#003B95' }}
              onClick={onOpenCreate}
            >
              Tạo Kỳ Mới
            </Button>
            <Button
              icon={<ThunderboltOutlined />}
              onClick={onOpenGenerate}
            >
              Khởi Tạo Tự Động Theo Năm
            </Button>
          </>
        )}
      />

      <Table
        columns={columns}
        dataSource={filteredPeriods}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 12 }}
        scroll={{ x: 1300 }}
        tableLayout="fixed"
      />
    </div>
  );
};
