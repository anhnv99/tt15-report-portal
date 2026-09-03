import React from 'react';
import { Row, Col, Card, Space, Typography, Button, Tag } from 'antd';
import { PieChartOutlined, ArrowRightOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { SimpleDonutChart } from '@/components/charts';
import type { DashboardPendingStats } from './DashboardKpiCards';

const { Text } = Typography;

interface DashboardPipelineSectionProps {
  batchApprovalDonutData: { label: string; value: number; color: string }[];
  pendingStats: DashboardPendingStats;
  approvedBatchesCount: number;
  onNavigateImports: () => void;
}

export const DashboardPipelineSection: React.FC<DashboardPipelineSectionProps> = ({
  batchApprovalDonutData,
  pendingStats,
  approvedBatchesCount,
  onNavigateImports,
}) => {
  return (
    <Row gutter={[16, 16]}>
      {/* Left: Batch Approval Status Donut */}
      <Col xs={24} lg={10}>
        <Card
          title={
            <Space>
              <PieChartOutlined style={{ color: '#0284C7' }} />
              <Text strong>Tỷ Lệ Phê Duyệt Lô Dữ Liệu Nguồn</Text>
            </Space>
          }
          extra={
            <Button type="link" size="small" onClick={onNavigateImports}>
              Quản lý lô <ArrowRightOutlined />
            </Button>
          }
          style={{ borderRadius: 8, height: '100%' }}
        >
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 16 }}>
            Tỷ lệ lô đang nằm chờ Checker phê duyệt hoặc có lỗi cần sửa đổi.
          </Text>
          <SimpleDonutChart
            data={batchApprovalDonutData}
            size={180}
            thickness={24}
            centerSubtitle="Lô nạp"
          />
        </Card>
      </Col>

      {/* Right: Operational Pipeline Funnel */}
      <Col xs={24} lg={14}>
        <Card
          title={
            <Space>
              <SafetyCertificateOutlined style={{ color: '#10B981' }} />
              <Text strong>Quy Trình Xử Lý & Trạng Thái Vận Hành Toàn Trình (Pipeline)</Text>
            </Space>
          }
          style={{ borderRadius: 8, height: '100%' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Step 1 */}
            <div
              style={{
                padding: 10,
                background: '#F8FAFC',
                borderRadius: 6,
                borderLeft: '4px solid #003B95',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 2,
                }}
              >
                <Text strong style={{ color: '#003B95', fontSize: 13 }}>
                  1. Tiền Xử Lý Dữ Liệu Nguồn (Stage & Ingest)
                </Text>
                <Tag color="blue">
                  {pendingStats.stagedBatches.length + approvedBatchesCount} Lô Hoàn Thành
                </Tag>
              </div>
              <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                Nạp tệp Excel/CSV đa sheet, bóc tách chỉ tiêu, lưu trữ Staging JSONB và phân tích
                tính hợp lệ.
              </Text>
            </div>

            {/* Step 2 */}
            <div
              style={{
                padding: 10,
                background: '#FFFBEB',
                borderRadius: 6,
                borderLeft: '4px solid #D97706',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 2,
                }}
              >
                <Text strong style={{ color: '#B45309', fontSize: 13 }}>
                  2. Phê Duyệt Lô & Chốt Dữ Liệu (Maker - Checker)
                </Text>
                <Tag color="warning">{pendingStats.stagedBatches.length} Lô Đang Chờ Duyệt</Tag>
              </div>
              <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                Checker kiểm tra tính toàn vẹn và bấm phê duyệt lô để sẵn sàng chuyển sang vòng tổng
                hợp.
              </Text>
            </div>

            {/* Step 3 */}
            <div
              style={{
                padding: 10,
                background: '#EEF2FF',
                borderRadius: 6,
                borderLeft: '4px solid #4F46E5',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 2,
                }}
              >
                <Text strong style={{ color: '#4338CA', fontSize: 13 }}>
                  3. Tổng Hợp Báo Cáo & Đối Soát Rules
                </Text>
                <Tag color="purple">{pendingStats.draftReports.length} Bản Nháp Đang Chờ</Tag>
              </div>
              <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                Chạy quy tắc kiểm tra logic (số tiền, kỳ hạn, danh mục, UNIQUE) và đóng gói cấu trúc
                JSON Phụ lục II.
              </Text>
            </div>

            {/* Step 4 */}
            <div
              style={{
                padding: 10,
                background: '#F0FDF4',
                borderRadius: 6,
                borderLeft: '4px solid #10B981',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 2,
                }}
              >
                <Text strong style={{ color: '#065F46', fontSize: 13 }}>
                  4. Ký Số, Đóng Gói SHA-256 & Phát Hành n8n
                </Text>
                <Tag color="success">{pendingStats.approvedReports.length} Bản Đã Sẵn Sàng</Tag>
              </div>
              <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                Checker ký duyệt → Tự động sinh mã băm SHA-256 tệp ZIP và kích hoạt Webhook bắn sang
                n8n gửi NHNN.
              </Text>
            </div>
          </div>
        </Card>
      </Col>
    </Row>
  );
};
