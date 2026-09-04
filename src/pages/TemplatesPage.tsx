import React, { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Typography, Space, Segmented, Button, message } from 'antd';
import { TableOutlined, CodeOutlined, SyncOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { catalogApi } from '@/api/catalog.api';
import type { ReportTemplate, ReportTemplateField, ReportTemplateRule } from '@/types';
import { TemplateListView } from '@/features/templates/TemplateListView';
import { TemplateJsonPreview } from '@/features/templates/TemplateJsonPreview';
import { TemplateDetailDrawer } from '@/features/templates/TemplateDetailDrawer';
import { TemplateRuleModal } from '@/features/templates/TemplateRuleModal';
import { CreateTemplateModal } from '@/features/templates/CreateTemplateModal';

const { Title, Text } = Typography;

export const TemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterDest, setFilterDest] = useState<string>('ALL');

  // View Mode: 'list' vs 'json-preview'
  const [viewMode, setViewMode] = useState<string>('list');

  // Preview Mode State
  const [previewTemplateCode, setPreviewTemplateCode] = useState<string>('D10');
  const [previewFields, setPreviewFields] = useState<ReportTemplateField[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

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
      if (data?.length && !previewTemplateCode) {
        setPreviewTemplateCode(data[0].reportCode);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (previewTemplateCode) {
      loadPreviewFields(previewTemplateCode);
    }
  }, [previewTemplateCode]);

  const loadPreviewFields = async (code: string) => {
    try {
      setPreviewLoading(true);
      const data = await catalogApi.getTemplateFields(code);
      setPreviewFields(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setPreviewLoading(false);
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
    await catalogApi.addTemplateField(selectedTemplate.reportCode, values);
    message.success('Đã thêm trường dữ liệu mới');
    loadTemplateDetail(selectedTemplate.reportCode);
  };

  const handleDeleteField = async (fieldId: number) => {
    if (!selectedTemplate) return;
    await catalogApi.deleteTemplateField(selectedTemplate.reportCode, fieldId);
    message.success('Đã xóa trường');
    loadTemplateDetail(selectedTemplate.reportCode);
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
    if (filterDest === 'ALL') return templates;
    return templates.filter((t) => {
      const dest = (t.targetDestination || 'CIC').toUpperCase();
      if (filterDest === 'SBV') return dest === 'SBV' || dest === 'SVB';
      return dest === filterDest;
    });
  }, [templates, filterDest]);

  return (
    <div>
      {/* Header Bar */}
      <Card style={{ marginBottom: 16, borderRadius: 8 }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={10}>
            <Title level={4} style={{ margin: 0, color: '#002B66' }}>
              Cấu Hình Biểu Mẫu Báo Cáo & Bộ Quy Tắc Đối Soát (Rule Engine)
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Hỗ trợ phân loại đa cơ quan: CIC (TTTD Quốc gia), SBV (Ngân hàng Nhà nước), PCB (Thông tin tín dụng VN).
            </Text>
          </Col>
          <Col xs={24} md={14} style={{ textAlign: 'right' }}>
            <Space wrap>
              {viewMode === 'list' && (
                <Segmented
                  value={filterDest}
                  onChange={(val) => setFilterDest(val as string)}
                  options={[
                    { label: `Tất cả (${templates.length})`, value: 'ALL' },
                    { label: '🔵 CIC', value: 'CIC' },
                    { label: '🟢 SBV', value: 'SBV' },
                    { label: '🟣 PCB', value: 'PCB' },
                  ]}
                />
              )}
              <Segmented
                value={viewMode}
                onChange={(val) => setViewMode(val as string)}
                options={[
                  {
                    label: (
                      <Space>
                        <TableOutlined />
                        <span>Danh Sách</span>
                      </Space>
                    ),
                    value: 'list',
                  },
                  {
                    label: (
                      <Space>
                        <CodeOutlined />
                        <span>JSON Phụ Lục</span>
                      </Space>
                    ),
                    value: 'json-preview',
                  },
                ]}
              />
              <Button
                type="primary"
                icon={<PlusCircleOutlined />}
                style={{ background: '#003B95' }}
                onClick={() => setCreateModalOpen(true)}
              >
                Tạo Mới Biểu Mẫu
              </Button>
              <Button icon={<SyncOutlined />} onClick={loadTemplates}>
                Làm mới
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Mode 1: Table List */}
      {viewMode === 'list' && (
        <TemplateListView
          templates={filteredTemplates}
          loading={loading}
          onOpenDetail={handleOpenDetail}
          onToggleActive={handleToggleActive}
          onViewJson={(code) => {
            setPreviewTemplateCode(code);
            setViewMode('json-preview');
          }}
        />
      )}

      {/* Mode 2: JSON Preview */}
      {viewMode === 'json-preview' && (
        <TemplateJsonPreview
          templates={templates}
          selectedCode={previewTemplateCode}
          fields={previewFields}
          loading={previewLoading}
          onSelectCode={(code) => setPreviewTemplateCode(code)}
          onOpenDetail={handleOpenDetail}
        />
      )}

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
