import React from 'react';
import { Drawer, Spin, Timeline, Typography, Tag, Empty, Card } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import type { CicReportEvent } from '@/types';

const { Text } = Typography;

interface VersionTimelineDrawerProps {
  open: boolean;
  events: CicReportEvent[];
  loading: boolean;
  onClose: () => void;
}

export const VersionTimelineDrawer: React.FC<VersionTimelineDrawerProps> = ({
  open,
  events,
  loading,
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
      width={500}
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
      </Spin>
    </Drawer>
  );
};
