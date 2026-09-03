import React from 'react';
import { Row, Col, Card, Statistic, Space, Typography, Progress } from 'antd';
import {
  ClockCircleOutlined,
  AuditOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

export interface DashboardPendingStats {
  pendingBatchesCount: number;
  stagedBatches: any[];
  uploadedBatches: any[];
  errorBatches: any[];
  rejectedBatches: any[];
  totalErrorRows: number;
  draftReports: any[];
  rejectedReports: any[];
  approvedReports: any[];
  submittedReports: any[];
  runningAggs: any[];
  failedAggs: any[];
  qualityRate: number;
}

interface DashboardKpiCardsProps {
  pendingStats: DashboardPendingStats;
  recentValidationErrors?: number;
  onNavigateImports: () => void;
  onNavigateReports: () => void;
}

export const DashboardKpiCards: React.FC<DashboardKpiCardsProps> = ({
  pendingStats,
  recentValidationErrors = 0,
  onNavigateImports,
  onNavigateReports,
}) => {
  return (
    <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
      {/* Card 1: Lô Chờ Phê Duyệt (Pending Batches) */}
      <Col xs={24} sm={12} md={8} lg={4}>
        <Card
          hoverable
          style={{
            borderRadius: 8,
            borderLeft: '4px solid #D97706',
            background: pendingStats.pendingBatchesCount > 0 ? '#FFFBEB' : '#FFFFFF',
          }}
          onClick={onNavigateImports}
        >
          <Statistic
            title={
              <Space>
                <ClockCircleOutlined style={{ color: '#D97706' }} />
                <Text strong style={{ fontSize: 12, color: '#92400E' }}>Lô Chờ Phê Duyệt</Text>
              </Space>
            }
            value={pendingStats.pendingBatchesCount}
            valueStyle={{ color: '#B45309', fontWeight: 700 }}
            suffix={<span style={{ fontSize: 12, color: '#92400E' }}>lô</span>}
          />
          <div style={{ marginTop: 6, fontSize: 11, color: '#B45309' }}>
            <b>{pendingStats.stagedBatches.length}</b> chờ Checker duyệt
          </div>
        </Card>
      </Col>

      {/* Card 2: Báo Cáo Nháp Chờ Ký Duyệt (Draft Reports) */}
      <Col xs={24} sm={12} md={8} lg={4}>
        <Card
          hoverable
          style={{
            borderRadius: 8,
            borderLeft: '4px solid #4F46E5',
            background: pendingStats.draftReports.length > 0 ? '#EEF2FF' : '#FFFFFF',
          }}
          onClick={onNavigateReports}
        >
          <Statistic
            title={
              <Space>
                <AuditOutlined style={{ color: '#4F46E5' }} />
                <Text strong style={{ fontSize: 12, color: '#3730A3' }}>Báo Cáo Nháp</Text>
              </Space>
            }
            value={pendingStats.draftReports.length}
            valueStyle={{ color: '#4338CA', fontWeight: 700 }}
            suffix={<span style={{ fontSize: 12, color: '#3730A3' }}>bản</span>}
          />
          <div style={{ marginTop: 6, fontSize: 11, color: '#4338CA' }}>
            Cần kiểm tra rules & ký số
          </div>
        </Card>
      </Col>

      {/* Card 3: Cảnh Báo Lô Có Dữ Liệu Lỗi (Data Error Batches) */}
      <Col xs={24} sm={12} md={8} lg={4}>
        <Card
          hoverable
          style={{
            borderRadius: 8,
            borderLeft: '4px solid #DC2626',
            background: pendingStats.errorBatches.length > 0 ? '#FEF2F2' : '#FFFFFF',
          }}
          onClick={onNavigateImports}
        >
          <Statistic
            title={
              <Space>
                <WarningOutlined style={{ color: '#DC2626' }} />
                <Text strong style={{ fontSize: 12, color: '#991B1B' }}>Lô Có Dòng Lỗi</Text>
              </Space>
            }
            value={pendingStats.errorBatches.length}
            valueStyle={{ color: '#DC2626', fontWeight: 700 }}
            suffix={<span style={{ fontSize: 12, color: '#991B1B' }}>lô</span>}
          />
          <div style={{ marginTop: 6, fontSize: 11, color: '#DC2626' }}>
            Tổng <b>{pendingStats.totalErrorRows}</b> dòng không hợp lệ
          </div>
        </Card>
      </Col>

      {/* Card 4: Lô & Báo Cáo Bị Từ Chối (Rejected Items) */}
      <Col xs={24} sm={12} md={8} lg={4}>
        <Card
          hoverable
          style={{
            borderRadius: 8,
            borderLeft: '4px solid #E11D48',
            background:
              pendingStats.rejectedBatches.length + pendingStats.rejectedReports.length > 0
                ? '#FFF1F2'
                : '#FFFFFF',
          }}
          onClick={onNavigateImports}
        >
          <Statistic
            title={
              <Space>
                <CloseCircleOutlined style={{ color: '#E11D48' }} />
                <Text strong style={{ fontSize: 12, color: '#9F1239' }}>Bị Từ Chối (Rejected)</Text>
              </Space>
            }
            value={pendingStats.rejectedBatches.length + pendingStats.rejectedReports.length}
            valueStyle={{ color: '#BE123C', fontWeight: 700 }}
            suffix={<span style={{ fontSize: 12, color: '#9F1239' }}>mục</span>}
          />
          <div style={{ marginTop: 6, fontSize: 11, color: '#BE123C' }}>
            {pendingStats.rejectedBatches.length} lô, {pendingStats.rejectedReports.length} báo cáo cần sửa
          </div>
        </Card>
      </Col>

      {/* Card 5: Cảnh Báo Quy Tắc Đối Soát (Rule Violations) */}
      <Col xs={24} sm={12} md={8} lg={4}>
        <Card
          hoverable
          style={{ borderRadius: 8, borderLeft: '4px solid #EA580C' }}
          onClick={onNavigateReports}
        >
          <Statistic
            title={
              <Space>
                <ExclamationCircleOutlined style={{ color: '#EA580C' }} />
                <Text strong style={{ fontSize: 12, color: '#64748B' }}>Cảnh Báo Rules</Text>
              </Space>
            }
            value={recentValidationErrors || pendingStats.failedAggs.length || 0}
            valueStyle={{ color: '#EA580C', fontWeight: 700 }}
            suffix={<span style={{ fontSize: 12, color: '#64748B' }}>lỗi</span>}
          />
          <div style={{ marginTop: 6, fontSize: 11, color: '#EA580C' }}>
            Đối soát số học & nghiệp vụ
          </div>
        </Card>
      </Col>

      {/* Card 6: Đã Sẵn Sàng / Hoàn Thành (Ready & Approved) */}
      <Col xs={24} sm={12} md={8} lg={4}>
        <Card hoverable style={{ borderRadius: 8, borderLeft: '4px solid #10B981' }}>
          <Statistic
            title={
              <Space>
                <CheckCircleOutlined style={{ color: '#10B981' }} />
                <Text strong style={{ fontSize: 12, color: '#64748B' }}>Chất Lượng Dữ Liệu</Text>
              </Space>
            }
            value={pendingStats.qualityRate}
            suffix="%"
            valueStyle={{ color: '#059669', fontWeight: 700 }}
          />
          <div style={{ marginTop: 6 }}>
            <Progress
              percent={pendingStats.qualityRate}
              size="small"
              strokeColor="#10B981"
              showInfo={false}
            />
          </div>
        </Card>
      </Col>
    </Row>
  );
};
