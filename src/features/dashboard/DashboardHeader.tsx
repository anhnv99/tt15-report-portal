import React from 'react';
import { Card, Row, Col, Typography, Space, Tag, Badge, Select, Tooltip, Button } from 'antd';
import { ReloadOutlined, CloudUploadOutlined } from '@ant-design/icons';
import type { DataPeriod } from '@/types';

const { Title, Text, Paragraph } = Typography;

interface DashboardHeaderProps {
  selectedPeriodId: number | 'ALL';
  periods: DataPeriod[];
  loading: boolean;
  lastUpdated: string;
  onPeriodChange: (val: number | 'ALL') => void;
  onRefresh: () => void;
  onNavigateImports: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  selectedPeriodId,
  periods,
  loading,
  lastUpdated,
  onPeriodChange,
  onRefresh,
  onNavigateImports,
}) => {
  return (
    <Card
      style={{
        marginBottom: 16,
        borderRadius: 8,
        background: 'linear-gradient(135deg, #001A44 0%, #003B95 100%)',
        color: '#FFFFFF',
        border: 'none',
      }}
      bodyStyle={{ padding: '16px 20px' }}
    >
      <Row justify="space-between" align="middle" gutter={[16, 12]}>
        <Col xs={24} lg={14}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
            <Title
              level={4}
              style={{
                color: '#FFFFFF',
                margin: 0,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                letterSpacing: '-0.2px',
              }}
            >
              RegOne — Trung Tâm Vận Hành Báo Cáo
            </Title>
            <Tag color="#0284C7" style={{ fontWeight: 600, border: 'none', margin: 0 }}>
              Phiên Bản 2.0
            </Tag>
            <Badge
              status="processing"
              text={<span style={{ color: '#FBBF24', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>War-Room Live</span>}
            />
          </div>
          <Paragraph style={{ color: '#94A3B8', margin: 0, fontSize: 13, lineHeight: 1.5 }}>
            <span style={{ color: '#38BDF8', fontWeight: 600 }}>One platform for regulatory reporting</span> •{' '}
            Theo dõi các lô dữ liệu chờ duyệt, báo cáo nháp tồn đọng, kiểm tra quy tắc đối soát
            và danh sách tác vụ cần xử lý ngay.
          </Paragraph>
        </Col>

        <Col xs={24} lg={10}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 8,
              flexWrap: 'nowrap',
            }}
          >
            {/* Period Filter Dropdown */}
            <Select
              value={selectedPeriodId}
              onChange={onPeriodChange}
              style={{ width: 180 }}
              size="middle"
              placeholder="Chọn kỳ"
            >
              <Select.Option value="ALL">Tất cả các kỳ</Select.Option>
              {periods.map((p) => (
                <Select.Option key={p.id} value={p.id}>
                  {p.code} - {p.name.slice(0, 12)}...
                </Select.Option>
              ))}
            </Select>

            {/* Refresh Button */}
            <Tooltip title={`Cập nhật lúc ${lastUpdated}`}>
              <Button
                icon={<ReloadOutlined spin={loading} />}
                onClick={onRefresh}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderColor: 'rgba(255,255,255,0.2)',
                  color: '#FFFFFF',
                  whiteSpace: 'nowrap',
                }}
              >
                Làm mới
              </Button>
            </Tooltip>

            {/* Upload Button */}
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              style={{
                background: '#0284C7',
                borderColor: '#0284C7',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
              onClick={onNavigateImports}
            >
              Nạp Lô Mới
            </Button>
          </div>
        </Col>
      </Row>
    </Card>
  );
};
