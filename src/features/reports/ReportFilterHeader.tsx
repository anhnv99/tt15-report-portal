import React from 'react';
import { Card, Row, Col, Select, Typography, Space, Tag } from 'antd';
import type { ReportTemplate, DataPeriod } from '@/types';

const { Title, Text } = Typography;

interface ReportFilterHeaderProps {
  templates: ReportTemplate[];
  periods: DataPeriod[];
  selectedTemplate: string;
  selectedPeriod: string;
  onSelectTemplate: (templateCode: string) => void;
  onSelectPeriod: (periodCode: string) => void;
}

export const ReportFilterHeader: React.FC<ReportFilterHeaderProps> = ({
  templates,
  periods,
  selectedTemplate,
  selectedPeriod,
  onSelectTemplate,
  onSelectPeriod,
}) => {
  return (
    <Card style={{ marginBottom: 16, borderRadius: 8 }}>
      <Row justify="space-between" align="middle" gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Title level={4} style={{ margin: 0, color: '#002B66' }}>
            Quản Lý Báo Cáo TT15 / QĐ573 (Maker - Checker Workflow)
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Quy trình khép kín: Tổng hợp dữ liệu &rarr; Kiểm tra Rules &rarr; Phê duyệt Maker-Checker &rarr; Đóng gói ZIP &rarr; Truyền nhận CIC.
          </Text>
        </Col>
        <Col xs={24} md={12} style={{ textAlign: 'right' }}>
          <Space wrap>
            <Select
              value={selectedTemplate}
              onChange={onSelectTemplate}
              style={{ width: 340, textAlign: 'left' }}
              showSearch
              optionFilterProp="children"
            >
              {templates.map((t) => {
                const dest = (t.targetDestination || 'CIC').toUpperCase();
                const destColor = dest === 'PCB' ? 'purple' : dest === 'SVB' || dest === 'SBV' ? 'green' : 'blue';
                return (
                  <Select.Option key={t.reportCode} value={t.reportCode}>
                    <Space>
                      <Tag color={destColor} style={{ fontWeight: 600, fontSize: 11, margin: 0 }}>
                        {dest}
                      </Tag>
                      <Text strong style={{ color: '#003B95' }}>[{t.reportCode}]</Text>
                      <span>Mẫu {t.templateNumber} - {t.reportName}</span>
                    </Space>
                  </Select.Option>
                );
              })}
            </Select>

            <Select
              value={selectedPeriod}
              onChange={onSelectPeriod}
              style={{ width: 180, textAlign: 'left' }}
              placeholder="Chọn kỳ dữ liệu"
            >
              {periods.map((p) => (
                <Select.Option key={p.code} value={p.code}>
                  {p.name}
                </Select.Option>
              ))}
            </Select>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};
