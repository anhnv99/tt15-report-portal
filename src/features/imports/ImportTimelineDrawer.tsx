import React from 'react';
import { Drawer, Spin, Timeline, Typography, Tag, Empty, Card } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import type { ImportApprovalEvent } from '@/types';

const { Text } = Typography;

interface ImportTimelineDrawerProps {
  open: boolean;
  events: ImportApprovalEvent[];
  loading: boolean;
  onClose: () => void;
}

export const ImportTimelineDrawer: React.FC<ImportTimelineDrawerProps> = ({
  open,
  events,
  loading,
  onClose,
}) => {
  const getActionColor = (eventType: string) => {
    switch (eventType) {
      case 'APPROVED':
        return 'green';
      case 'REJECTED':
        return 'red';
      case 'STAGED':
        return 'blue';
      case 'UPLOADED':
      default:
        return 'orange';
    }
  };

  return (
    <Drawer
      title={
        <span>
          <HistoryOutlined style={{ marginRight: 8, color: '#003B95' }} />
          Lịch Sử Phê Duyệt & Xử Lý Đợt Dữ Liệu
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
            items={events.map((e) => ({
              color: getActionColor(e.eventType),
              children: (
                <Card size="small" style={{ marginBottom: 8, borderRadius: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Tag color={getActionColor(e.eventType)}>{e.eventType}</Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {e.occurredAt ? new Date(e.occurredAt).toLocaleString('vi-VN') : ''}
                    </Text>
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 13 }}>Người thực hiện:</Text>{' '}
                    <Text code>{e.actor || 'Hệ thống'}</Text>
                  </div>
                  {e.reason && (
                    <div style={{ marginTop: 4, color: '#475569', fontSize: 12 }}>
                      Lý do: {e.reason}
                    </div>
                  )}
                </Card>
              ),
            }))}
          />
        )}
      </Spin>
    </Drawer>
  );
};
