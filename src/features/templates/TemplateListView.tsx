import React from 'react';
import { Card, Table, Tag, Button, Space, Typography, Switch, Tooltip } from 'antd';
import { SlidersHorizontal, FileArchive, FileSpreadsheet } from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import type { ReportTemplate } from '@/types';
import { downloadSbvOfficialExcelTemplate } from '@/features/imports/utils/multiSheetTemplateGenerator';
import { getTemplateDestinationProfile } from '@/features/reporting-destinations/resolveReportDestination';

const { Text } = Typography;

interface TemplateListViewProps {
  templates: ReportTemplate[];
  loading: boolean;
  onOpenDetail: (tpl: ReportTemplate) => void;
  onToggleActive: (reportCode: string) => void;
}

export const TemplateListView: React.FC<TemplateListViewProps> = ({
  templates,
  loading,
  onOpenDetail,
  onToggleActive,
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
      title: 'Đích Nộp (Target)',
      dataIndex: 'targetDestination',
      key: 'targetDestination',
      width: 130,
      render: (_, template) => {
        const profile = getTemplateDestinationProfile(template);
        return <Tag color={profile.tagColor} style={{ fontWeight: 600 }}>{profile.label}</Tag>;
      },
    },
    {
      title: 'Tên Biểu Mẫu Báo Cáo',
      dataIndex: 'reportName',
      key: 'reportName',
      width: 400,
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
      title: 'Quy Trình Duyệt',
      key: 'requireMakerChecker',
      width: 140,
      render: (_, r) => {
        const req = r.requireMakerChecker !== false;
        return (
          <Tag color={req ? 'blue' : 'green'} style={{ fontWeight: 500 }}>
            {req ? 'Maker - Checker' : 'STP Tự động'}
          </Tag>
        );
      },
    },
    {
      title: 'Trạng Thái',
      key: 'isActive',
      width: 150,
      render: (_, r) => {
        const active = r.isActive !== false;
        return (
          <Tooltip title={active ? 'Bấm để tạm dừng biểu mẫu này' : 'Bấm để kích hoạt biểu mẫu này'}>
            <Space size="small">
              <Switch
                size="small"
                checked={active}
                onChange={() => onToggleActive(r.reportCode)}
              />
              <Tag color={active ? 'success' : 'default'} style={{ fontSize: 11 }}>
                {active ? 'Hoạt động' : 'Tạm dừng'}
              </Tag>
            </Space>
          </Tooltip>
        );
      },
    },
    {
      title: 'Thao Tác',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_, r) => (
        <Space size={6}>
          <Tooltip title="Cấu hình chỉ tiêu, sheet nguồn & rules">
            <Button
              type="primary"
              shape="circle"
              size="small"
              icon={<SlidersHorizontal size={14} />}
              style={{ background: '#003B95', borderColor: '#003B95', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => onOpenDetail(r)}
            />
          </Tooltip>
          {getTemplateDestinationProfile(r).supportsExcelMapping ? (
            <Tooltip title="Tải Mẫu Biểu Excel NHNN (.xlsx)">
              <Button
                shape="circle"
                size="small"
                icon={<FileSpreadsheet size={14} />}
                style={{
                  background: '#16A34A',
                  borderColor: '#16A34A',
                  color: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={() => downloadSbvOfficialExcelTemplate(r.reportCode, r)}
              />
            </Tooltip>
          ) : (
            <Tooltip title="Xem thông tin tệp và cấu hình biểu mẫu">
              <Button
                shape="circle"
                size="small"
                icon={<FileArchive size={14} />}
                onClick={() => onOpenDetail(r)}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card style={{ borderRadius: 8 }} styles={{ body: { padding: '16px 24px' } }}>
      <Table
        columns={columns}
        dataSource={templates}
        rowKey="reportCode"
        loading={loading}
        pagination={{ pageSize: 15 }}
        scroll={{ x: 1500 }}
      />
    </Card>
  );
};
