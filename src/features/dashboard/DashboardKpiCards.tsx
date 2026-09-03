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
  const hasErrors = pendingStats.errorBatches.length > 0 || pendingStats.totalErrorRows > 0;
  const rejectedCount = pendingStats.rejectedBatches.length + pendingStats.rejectedReports.length;
  const hasRejected = rejectedCount > 0;
  const ruleErrorCount = recentValidationErrors || pendingStats.failedAggs.length || 0;
  const hasRuleErrors = ruleErrorCount > 0;

  const cardBaseStyle: React.CSSProperties = {
    borderRadius: 8,
    border: '1px solid #E2E8F0',
    background: '#FFFFFF',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
    height: '100%',
    transition: 'all 0.2s ease',
  };

  return (
    <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
      {/* Card 1: Lô Chờ Phê Duyệt (Pending Batches) - Màu chủ đạo */}
      <Col xs={24} sm={12} md={8} lg={4}>
        <Card
          hoverable
          style={{
            ...cardBaseStyle,
            borderTop: pendingStats.pendingBatchesCount > 0 ? '3px solid #1E63FF' : '1px solid #E2E8F0',
          }}
          onClick={onNavigateImports}
        >
          <Statistic
            title={
              <Space>
                <ClockCircleOutlined style={{ color: '#1E63FF' }} />
                <Text strong style={{ fontSize: 12, color: '#475569' }}>Lô Chờ Duyệt</Text>
              </Space>
            }
            value={pendingStats.pendingBatchesCount}
            valueStyle={{ color: '#0F172A', fontWeight: 700, fontSize: 24 }}
            suffix={<span style={{ fontSize: 12, color: '#64748B', fontWeight: 400 }}>lô</span>}
          />
          <div style={{ marginTop: 6, fontSize: 11, color: '#64748B' }}>
            <span style={{ color: '#0F172A', fontWeight: 600 }}>{pendingStats.stagedBatches.length}</span> chờ Checker duyệt
          </div>
        </Card>
      </Col>

      {/* Card 2: Báo Cáo Nháp Chờ Ký Duyệt (Draft Reports) - Màu chủ đạo */}
      <Col xs={24} sm={12} md={8} lg={4}>
        <Card
          hoverable
          style={{
            ...cardBaseStyle,
            borderTop: pendingStats.draftReports.length > 0 ? '3px solid #0284C7' : '1px solid #E2E8F0',
          }}
          onClick={onNavigateReports}
        >
          <Statistic
            title={
              <Space>
                <AuditOutlined style={{ color: '#0284C7' }} />
                <Text strong style={{ fontSize: 12, color: '#475569' }}>Báo Cáo Nháp</Text>
              </Space>
            }
            value={pendingStats.draftReports.length}
            valueStyle={{ color: '#0F172A', fontWeight: 700, fontSize: 24 }}
            suffix={<span style={{ fontSize: 12, color: '#64748B', fontWeight: 400 }}>bản</span>}
          />
          <div style={{ marginTop: 6, fontSize: 11, color: '#64748B' }}>
            Cần kiểm tra rules & ký số
          </div>
        </Card>
      </Col>

      {/* Card 3: Lô Có Dòng Lỗi (Data Error Batches) - ĐIỂM NHẤN CẢNH BÁO */}
      <Col xs={24} sm={12} md={8} lg={4}>
        <Card
          hoverable
          style={{
            ...cardBaseStyle,
            borderTop: hasErrors ? '3px solid #EF4444' : '1px solid #E2E8F0',
            borderColor: hasErrors ? '#FECACA' : '#E2E8F0',
          }}
          onClick={onNavigateImports}
        >
          <Statistic
            title={
              <Space>
                <WarningOutlined style={{ color: hasErrors ? '#EF4444' : '#64748B' }} />
                <Text strong style={{ fontSize: 12, color: hasErrors ? '#DC2626' : '#475569' }}>
                  Lô Có Dòng Lỗi
                </Text>
              </Space>
            }
            value={pendingStats.errorBatches.length}
            valueStyle={{ color: hasErrors ? '#DC2626' : '#0F172A', fontWeight: 700, fontSize: 24 }}
            suffix={<span style={{ fontSize: 12, color: hasErrors ? '#DC2626' : '#64748B', fontWeight: 400 }}>lô</span>}
          />
          <div style={{ marginTop: 6, fontSize: 11, color: hasErrors ? '#B91C1C' : '#64748B' }}>
            {hasErrors ? (
              <>
                Tổng <b style={{ color: '#DC2626' }}>{pendingStats.totalErrorRows}</b> dòng cần sửa
              </>
            ) : (
              'Không có dòng lỗi'
            )}
          </div>
        </Card>
      </Col>

      {/* Card 4: Lô & Báo Cáo Bị Từ Chối (Rejected Items) - ĐIỂM NHẤN CẢNH BÁO NẾU CÓ */}
      <Col xs={24} sm={12} md={8} lg={4}>
        <Card
          hoverable
          style={{
            ...cardBaseStyle,
            borderTop: hasRejected ? '3px solid #F59E0B' : '1px solid #E2E8F0',
            borderColor: hasRejected ? '#FED7AA' : '#E2E8F0',
          }}
          onClick={onNavigateImports}
        >
          <Statistic
            title={
              <Space>
                <CloseCircleOutlined style={{ color: hasRejected ? '#F59E0B' : '#64748B' }} />
                <Text strong style={{ fontSize: 12, color: hasRejected ? '#B45309' : '#475569' }}>
                  Bị Từ Chối
                </Text>
              </Space>
            }
            value={rejectedCount}
            valueStyle={{ color: hasRejected ? '#B45309' : '#0F172A', fontWeight: 700, fontSize: 24 }}
            suffix={<span style={{ fontSize: 12, color: hasRejected ? '#B45309' : '#64748B', fontWeight: 400 }}>mục</span>}
          />
          <div style={{ marginTop: 6, fontSize: 11, color: hasRejected ? '#B45309' : '#64748B' }}>
            {hasRejected
              ? `${pendingStats.rejectedBatches.length} lô, ${pendingStats.rejectedReports.length} báo cáo`
              : 'Không có mục bị từ chối'}
          </div>
        </Card>
      </Col>

      {/* Card 5: Cảnh Báo Quy Tắc Đối Soát (Rule Violations) - Màu chủ đạo */}
      <Col xs={24} sm={12} md={8} lg={4}>
        <Card
          hoverable
          style={{
            ...cardBaseStyle,
            borderTop: hasRuleErrors ? '3px solid #F59E0B' : '1px solid #E2E8F0',
          }}
          onClick={onNavigateReports}
        >
          <Statistic
            title={
              <Space>
                <ExclamationCircleOutlined style={{ color: hasRuleErrors ? '#F59E0B' : '#64748B' }} />
                <Text strong style={{ fontSize: 12, color: hasRuleErrors ? '#B45309' : '#475569' }}>
                  Cảnh Báo Rules
                </Text>
              </Space>
            }
            value={ruleErrorCount}
            valueStyle={{ color: hasRuleErrors ? '#B45309' : '#0F172A', fontWeight: 700, fontSize: 24 }}
            suffix={<span style={{ fontSize: 12, color: '#64748B', fontWeight: 400 }}>lỗi</span>}
          />
          <div style={{ marginTop: 6, fontSize: 11, color: '#64748B' }}>
            {hasRuleErrors ? 'Vi phạm logic đối soát' : 'Quy tắc kiểm tra hợp lệ'}
          </div>
        </Card>
      </Col>

      {/* Card 6: Chất Lượng Dữ Liệu (%) - Màu chủ đạo */}
      <Col xs={24} sm={12} md={8} lg={4}>
        <Card hoverable style={cardBaseStyle}>
          <Statistic
            title={
              <Space>
                <CheckCircleOutlined style={{ color: '#0284C7' }} />
                <Text strong style={{ fontSize: 12, color: '#475569' }}>Chất Lượng Dữ Liệu</Text>
              </Space>
            }
            value={pendingStats.qualityRate}
            suffix="%"
            valueStyle={{ color: '#0F172A', fontWeight: 700, fontSize: 24 }}
          />
          <div style={{ marginTop: 6 }}>
            <Progress
              percent={pendingStats.qualityRate}
              size="small"
              strokeColor="#0284C7"
              showInfo={false}
            />
          </div>
        </Card>
      </Col>
    </Row>
  );
};
