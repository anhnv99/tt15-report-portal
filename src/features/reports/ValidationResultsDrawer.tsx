import React from 'react';
import { Drawer, Spin, Table, Tag, Button, Space, Typography, Alert, Empty } from 'antd';
import { DownloadOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { ValidationResult } from '@/types';
import { reportingApi } from '@/api/reporting.api';

const { Text } = Typography;

interface ValidationResultsDrawerProps {
  open: boolean;
  results: ValidationResult[];
  loading: boolean;
  aggregationId: string;
  onClose: () => void;
}

export const ValidationResultsDrawer: React.FC<ValidationResultsDrawerProps> = ({
  open,
  results,
  loading,
  aggregationId,
  onClose,
}) => {
  const handleExportCsv = async () => {
    if (!aggregationId) return;
    try {
      const res: any = await reportingApi.exportValidationResultsCsv(aggregationId);
      const blob = res instanceof Blob ? res : new Blob([res.data || res], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ket_qua_kiem_tra_rules_${aggregationId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const columns: ColumnsType<ValidationResult> = [
    {
      title: 'Mức Độ',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (s: string) => {
        const mapColor: Record<string, string> = {
          ERROR: 'error',
          WARNING: 'warning',
          INFO: 'blue',
        };
        return <Tag color={mapColor[s] || 'default'}>{s}</Tag>;
      },
    },
    {
      title: 'Mã Quy Tắc (Rule Code)',
      dataIndex: 'ruleCode',
      key: 'ruleCode',
      width: 190,
      render: (c) => <Text code strong>{c}</Text>,
    },
    {
      title: 'Chỉ Tiêu / Dòng',
      key: 'field',
      width: 140,
      render: (_, r) => (
        <span>
          {r.fieldCode ? <Tag color="geekblue">{r.fieldCode}</Tag> : null}
          {r.rowNumber ? <Text type="secondary">Dòng {r.rowNumber}</Text> : null}
        </span>
      ),
    },
    {
      title: 'Nội Dung Kiểm Tra & Thông Báo Vi Phạm',
      dataIndex: 'message',
      key: 'message',
      render: (m) => <Text>{m}</Text>,
    },
  ];

  return (
    <Drawer
      title={
        <Space>
          <SafetyCertificateOutlined style={{ color: '#003B95' }} />
          <span>Kết Quả Kiểm Tra Validation Rules 3 Cấp ({results.length} vi phạm)</span>
        </Space>
      }
      placement="right"
      width={850}
      onClose={onClose}
      open={open}
      extra={
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          style={{ background: '#003B95' }}
          onClick={handleExportCsv}
          disabled={!results.length}
        >
          Xuất Báo Cáo Lỗi CSV
        </Button>
      }
    >
      <Spin spinning={loading}>
        <Alert
          message="Phạm vi kiểm tra đối soát 3-Tier Validation:"
          description="Bao gồm: Kiểm tra định dạng trường Phụ lục I, Logic nghiệp vụ nội bộ báo cáo, và Đối chiếu chéo giữa các báo cáo theo chuẩn QĐ573."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {results.length === 0 ? (
          <Empty description="Tuyệt vời! Không phát hiện lỗi hoặc vi phạm dữ liệu nào." />
        ) : (
          <Table
            columns={columns}
            dataSource={results}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="small"
          />
        )}
      </Spin>
    </Drawer>
  );
};
