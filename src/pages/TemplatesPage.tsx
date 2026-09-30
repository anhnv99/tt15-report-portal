import React, { useState, useEffect, useMemo } from 'react';
import { Typography, Button, message, Input, Select } from 'antd';
import { SyncOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { catalogApi } from '@/api/catalog.api';
import type { ReportTemplate, ReportTemplateField, ReportTemplateRule } from '@/types';
import { TemplateListView } from '@/features/templates/TemplateListView';
import { TemplateDetailDrawer } from '@/features/templates/TemplateDetailDrawer';
import { TemplateRuleModal } from '@/features/templates/TemplateRuleModal';
import { CreateTemplateModal } from '@/features/templates/CreateTemplateModal';
import { matchesTemplateDestination } from '@/features/templates/templateDestination';
import { OperationalFilterBar } from '@/components/OperationalFilterBar';
import { REPORT_DESTINATION_PROFILES } from '@/features/reporting-destinations/profiles';

const { Title, Text } = Typography;

export const TemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterDest, setFilterDest] = useState<string>('ALL');
  const [filterText, setFilterText] = useState('');
  const [filterFrequency, setFilterFrequency] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();

  // Create Template Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  // Detail Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [fields, setFields] = useState<ReportTemplateField[]>([]);
  const [rules, setRules] = useState<ReportTemplateRule[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Rule Modal State
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ReportTemplateRule | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await catalogApi.getReportTemplates();
      setTemplates(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (tpl: ReportTemplate) => {
    setSelectedTemplate(tpl);
    setDrawerOpen(true);
    loadTemplateDetail(tpl.reportCode);
  };

  const loadTemplateDetail = async (reportCode: string) => {
    try {
      setDetailLoading(true);
      const [fData, rData] = await Promise.all([
        catalogApi.getTemplateFields(reportCode),
        catalogApi.getTemplateRules(reportCode),
      ]);
      setFields(fData || []);
      setRules(rData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Field Actions
  const handleAddField = async (values: any) => {
    if (!selectedTemplate) return;
    try {
      await catalogApi.addTemplateField(selectedTemplate.reportCode, values);
      message.success('Đã thêm trường dữ liệu mới thành công');
      loadTemplateDetail(selectedTemplate.reportCode);
    } catch (err: any) {
      console.error(err);
      message.error(err?.response?.data?.message || err?.message || 'Không thể thêm trường dữ liệu');
      throw err;
    }
  };

  const handleDeleteField = async (fieldId: number) => {
    if (!selectedTemplate) return;
    await catalogApi.deleteTemplateField(selectedTemplate.reportCode, fieldId);
    message.success('Đã xóa trường');
    loadTemplateDetail(selectedTemplate.reportCode);
  };

  const handleUpdateField = async (fieldId: number, values: any) => {
    if (!selectedTemplate) return;
    try {
      await catalogApi.updateTemplateField(selectedTemplate.reportCode, fieldId, values);
      message.success('Đã cập nhật dòng mapping thành công');
      loadTemplateDetail(selectedTemplate.reportCode);
    } catch (err: any) {
      console.error(err);
      message.error(err?.response?.data?.message || err?.message || 'Không thể cập nhật dòng mapping');
      throw err;
    }
  };

  // Rule Actions
  const handleSaveRule = async (values: any) => {
    if (!selectedTemplate) return;
    const payload: Partial<ReportTemplateRule> = {
      actualKey: values.actualKey,
      expectedKey: values.expectedKey,
      operator: values.operator,
      tolerance: values.tolerance || 0,
      message: values.message,
    };

    if (editingRule) {
      await catalogApi.updateTemplateRule(selectedTemplate.reportCode, editingRule.id, payload);
      message.success('Đã cập nhật quy tắc kiểm tra!');
    } else {
      await catalogApi.addTemplateRule(selectedTemplate.reportCode, payload);
      message.success('Đã thêm quy tắc kiểm tra mới thành công!');
    }

    setRuleModalOpen(false);
    setEditingRule(null);
    loadTemplateDetail(selectedTemplate.reportCode);
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (!selectedTemplate) return;
    await catalogApi.deleteTemplateRule(selectedTemplate.reportCode, ruleId);
    message.success('Đã xóa quy tắc');
    loadTemplateDetail(selectedTemplate.reportCode);
  };

  // Template Actions
  const handleCreateTemplate = async (values: any) => {
    try {
      setCreateLoading(true);
      await catalogApi.createReportTemplate(values);
      message.success(`Đã tạo thành công biểu mẫu báo cáo ${values.reportCode}!`);
      setCreateModalOpen(false);
      loadTemplates();
    } catch (err: any) {
      console.error(err);
      message.error(err?.response?.data?.message || 'Không thể tạo biểu mẫu báo cáo');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleActive = async (reportCode: string) => {
    try {
      const res = await catalogApi.toggleTemplateActive(reportCode);
      const isNowActive = res?.isActive !== false;
      message.success(`Đã ${isNowActive ? 'kích hoạt' : 'tạm dừng'} biểu mẫu ${reportCode}!`);
      loadTemplates();
    } catch (err) {
      console.error(err);
      message.error('Không thể cập nhật trạng thái biểu mẫu');
    }
  };

  const filteredTemplates = useMemo(() => {
    const normalizedText = filterText.trim().toLowerCase();
    return templates.filter((template) => {
      const matchesText = !normalizedText || [template.reportCode, template.reportName, template.templateNumber]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedText));
      const isActive = template.isActive !== false && template.active !== false;
      const matchesStatus = !filterStatus || (filterStatus === 'ACTIVE' ? isActive : !isActive);

      return matchesTemplateDestination(template, filterDest)
        && matchesText
        && (!filterFrequency || template.frequency === filterFrequency)
        && matchesStatus;
    });
  }, [templates, filterDest, filterText, filterFrequency, filterStatus]);

  const frequencyOptions = useMemo(
    () => [...new Set(templates.map((template) => template.frequency).filter(Boolean))]
      .sort()
      .map((frequency) => ({ value: frequency!, label: frequency })),
    [templates],
  );

  return (
    <div>
      <Title level={4} style={{ margin: '0 0 4px', color: '#002B66' }}>
        Cấu Hình Biểu Mẫu Báo Cáo & Bộ Quy Tắc Đối Soát (Rule Engine)
      </Title>
      <Text type="secondary" style={{ display: 'block', fontSize: 13, marginBottom: 16 }}>
        Hỗ trợ phân loại đa cơ quan: CIC (TTTD Quốc gia), SBV (Ngân hàng Nhà nước), PCB (Thông tin tín dụng VN).
      </Text>

      <OperationalFilterBar
        filters={(
          <>
            <Input.Search allowClear placeholder="Tìm mã, tên hoặc số biểu mẫu" value={filterText} onChange={(event) => setFilterText(event.target.value)} style={{ width: 260 }} />
            <Select value={filterDest} onChange={setFilterDest} style={{ width: 160 }} options={[
              { label: `Tất cả cơ quan (${templates.length})`, value: 'ALL' },
              ...Object.values(REPORT_DESTINATION_PROFILES).map((profile) => ({ label: profile.label, value: profile.id })),
            ]} />
            <Select allowClear placeholder="Chu kỳ báo cáo" value={filterFrequency} onChange={setFilterFrequency} style={{ width: 150 }} options={frequencyOptions} />
            <Select allowClear placeholder="Trạng thái" value={filterStatus} onChange={setFilterStatus} style={{ width: 130 }} options={[
              { label: 'Đang dùng', value: 'ACTIVE' },
              { label: 'Tạm dừng', value: 'INACTIVE' },
            ]} />
          </>
        )}
        actions={(
          <>
            <Button type="primary" icon={<PlusCircleOutlined />} style={{ background: '#003B95' }} onClick={() => setCreateModalOpen(true)}>Tạo Mới Biểu Mẫu</Button>
            <Button icon={<SyncOutlined />} onClick={loadTemplates}>Làm mới</Button>
          </>
        )}
      />

      <TemplateListView
        templates={filteredTemplates}
        loading={loading}
        onOpenDetail={handleOpenDetail}
        onToggleActive={handleToggleActive}
      />

      {/* Detail Drawer */}
      <TemplateDetailDrawer
        open={drawerOpen}
        template={selectedTemplate}
        fields={fields}
        rules={rules}
        loading={detailLoading}
        onClose={() => setDrawerOpen(false)}
        onOpenAddRule={() => {
          setEditingRule(null);
          setRuleModalOpen(true);
        }}
        onEditRule={(r) => {
          setEditingRule(r);
          setRuleModalOpen(true);
        }}
        onDeleteRule={handleDeleteRule}
        onAddField={handleAddField}
        onUpdateField={handleUpdateField}
        onDeleteField={handleDeleteField}
      />

      {/* Add / Edit Rule Modal */}
      <TemplateRuleModal
        open={ruleModalOpen}
        editingRule={editingRule}
        onCancel={() => {
          setRuleModalOpen(false);
          setEditingRule(null);
        }}
        onSubmit={handleSaveRule}
      />

      {/* Create New Template Modal */}
      <CreateTemplateModal
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onSubmit={handleCreateTemplate}
        loading={createLoading}
      />
    </div>
  );
};
