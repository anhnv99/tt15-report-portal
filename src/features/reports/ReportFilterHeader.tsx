import React from 'react';
import { Select, Typography, Space, Tag } from 'antd';
import type { ReportTemplate, DataPeriod } from '@/types';
import { getTemplateDestinationProfile } from '@/features/reporting-destinations/resolveReportDestination';

const { Text } = Typography;

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
    <>
            <Select
              value={selectedTemplate}
              onChange={onSelectTemplate}
              style={{ width: 340, textAlign: 'left' }}
              showSearch
              optionFilterProp="children"
            >
              {templates.map((t) => {
                const profile = getTemplateDestinationProfile(t);
                return (
                  <Select.Option key={t.reportCode} value={t.reportCode}>
                    <Space>
                      <Tag color={profile.tagColor} style={{ fontWeight: 600, fontSize: 11, margin: 0 }}>
                        {profile.label}
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
    </>
  );
};
