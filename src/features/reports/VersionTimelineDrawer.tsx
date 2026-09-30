import React from 'react';
import { Drawer, Spin, Timeline, Typography, Tag, Empty, Card, Divider, Table } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import type { CicReportEvent, ReportAdjustmentAudit, ReportVersionFormula } from '@/types';

const { Text } = Typography;

interface VersionTimelineDrawerProps {
  open: boolean;
  events: CicReportEvent[];
  loading: boolean;
  adjustments: ReportAdjustmentAudit[];
  formulas: ReportVersionFormula[];
  onClose: () => void;
}

export const VersionTimelineDrawer: React.FC<VersionTimelineDrawerProps> = ({
  open,
  events,
  loading,
  adjustments,
  formulas,
  onClose,
}) => {
  const getActionColor = (action: string) => {
    switch (action) {
      case 'SUBMITTED':
      case 'APPROVED':
        return 'green';
      case 'REJECTED':
        return 'red';
      case 'CREATED':
        return 'blue';
      default:
        return 'gray';
    }
  };

  return (
    <Drawer
      title={
        <span>
          <HistoryOutlined style={{ marginRight: 8, color: '#003B95' }} />
          Lịch Sử Sự Kiện & Phê Duyệt (Audit Timeline)
        </span>
      }
      placement="right"
      size={500}
      onClose={onClose}
      open={open}
    >
      <Spin spinning={loading}>
        {events.length === 0 ? (
          <Empty description="Chưa có sự kiện nào được ghi nhận" />
        ) : (
          <Timeline
            mode="left"
            items={events.map((e) => {
              const actionName = e.action || e.eventType || 'UNKNOWN';
              return {
                color: getActionColor(actionName),
                children: (
                  <Card size="small" style={{ marginBottom: 8, borderRadius: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Tag color={getActionColor(actionName)}>{actionName}</Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {e.occurredAt ? new Date(e.occurredAt).toLocaleString('vi-VN') : ''}
                      </Text>
                    </div>
                    <div>
                      <Text strong style={{ fontSize: 13 }}>
                        Người thực hiện:
                      </Text>{' '}
                      <Text code>{e.actorRef || e.actor || 'Hệ thống'}</Text>
                    </div>
                    {(e.content || e.reason) && (
                      <div style={{ marginTop: 4, color: '#475569', fontSize: 12 }}>
                        {e.content || e.reason}
                      </div>
                    )}
                  </Card>
                ),
              };
            })}
          />
        )}
        <Divider>Điều chỉnh số liệu</Divider>
        {adjustments.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Version này chưa có điều chỉnh ô" /> : (
          <Table size="small" rowKey={(row) => `${row.sheetCode}-${row.lineCode}-${row.columnCode}-${row.changedAt}`}
            pagination={{ pageSize: 8 }} scroll={{ x: 760 }} dataSource={adjustments}
            columns={[
              { title: 'Sheet / ô', width: 160, render: (_, row) => <Text code>{row.sheetCode}.{row.lineCode}.{row.columnCode}</Text> },
              { title: 'Trước', dataIndex: 'oldValue', width: 100, render: (value) => value ?? '-' },
              { title: 'Sau', dataIndex: 'newValue', width: 100 },
              { title: 'Loại', dataIndex: 'changeType', width: 100, render: (value) => <Tag color={value === 'MANUAL' ? 'orange' : 'blue'}>{value}</Tag> },
              { title: 'Lý do / người sửa', width: 190, render: (_, row) => <><div>{row.reason}</div><Text type="secondary">{row.changedBy}</Text></> },
            ]} />
        )}
        <Divider>Công thức đã dùng cho version</Divider>
        {formulas.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Version này không có công thức tổng được lưu" /> : (
          <Table size="small" rowKey={(row) => `${row.sheetCode}-${row.lineCode}-${row.columnCode}`}
            pagination={{ pageSize: 8 }} scroll={{ x: 620 }} dataSource={formulas}
            columns={[
              { title: 'Sheet / ô tổng', width: 210, render: (_, row) => <Text code>{row.sheetCode}.{row.lineCode}.{row.columnCode}</Text> },
              { title: 'Biểu thức', dataIndex: 'expression', render: (value) => <Text code>{value}</Text> },
            ]} />
        )}
      </Spin>
    </Drawer>
  );
};
