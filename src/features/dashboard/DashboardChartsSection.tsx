import React from 'react';
import { Row, Col, Card, Space, Typography, Tag, Button } from 'antd';
import { BarChartOutlined, PieChartOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { SimpleBarChart, SimpleDonutChart } from '@/components/charts';
import type { BarChartItem } from '@/components/charts';

const { Text } = Typography;

interface DashboardChartsSectionProps {
  filteredBatchesCount: number;
  backlogChartData: BarChartItem[];
  reportWorkflowDonutData: { label: string; value: number; color: string }[];
  onNavigateReports: () => void;
}

export const DashboardChartsSection: React.FC<DashboardChartsSectionProps> = ({
  filteredBatchesCount,
  backlogChartData,
  reportWorkflowDonutData,
  onNavigateReports,
}) => {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      {/* Chart 1: Bar Chart Data Rows & Error Backlog by Template */}
      <Col xs={24} lg={14}>
        <Card
          title={
            <Space>
              <BarChartOutlined style={{ color: '#003B95' }} />
              <Text strong>Khối Lượng Hợp Lệ vs Cảnh Báo Lỗi Theo Biểu Mẫu</Text>
            </Space>
          }
          extra={<Tag color="blue">{filteredBatchesCount} Lô Dữ Liệu Nguồn</Tag>}
          style={{ borderRadius: 8, height: '100%' }}
        >
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
            Đo lường mức độ tuân thủ quy chuẩn dữ liệu giữa các biểu mẫu (D10, D31, D99...). Cột đỏ
            thể hiện dòng dữ liệu bị chặn cần bổ sung.
          </Text>
          <SimpleBarChart
            data={backlogChartData}
            height={230}
            primaryColor="#0284C7"
            secondaryColor="#EF4444"
            primaryName="Dòng Hợp Lệ"
            secondaryName="Dòng Cảnh Báo Lỗi"
            valueUnit="dòng"
          />
        </Card>
      </Col>

      {/* Chart 2: Donut Chart Report Workflow Status */}
      <Col xs={24} lg={10}>
        <Card
          title={
            <Space>
              <PieChartOutlined style={{ color: '#10B981' }} />
              <Text strong>Tình Trạng Hàng Đợi Báo Cáo CIC</Text>
            </Space>
          }
          extra={
            <Button type="link" size="small" onClick={onNavigateReports}>
              Chi tiết <ArrowRightOutlined />
            </Button>
          }
          style={{ borderRadius: 8, height: '100%' }}
        >
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 16 }}>
            Phân bổ trạng thái phê duyệt các phiên bản báo cáo (Bản nháp chờ duyệt, Đã duyệt, Đã gửi).
          </Text>
          <SimpleDonutChart
            data={reportWorkflowDonutData}
            size={190}
            thickness={26}
            centerSubtitle="Báo cáo"
          />
        </Card>
      </Col>
    </Row>
  );
};
