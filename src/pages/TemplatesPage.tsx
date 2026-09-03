import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Space, Segmented, Button, message } from 'antd';
import { TableOutlined, CodeOutlined, SyncOutlined } from '@ant-design/icons';
import { catalogApi } from '@/api/catalog.api';
import type { ReportTemplate, ReportTemplateField, ReportTemplateRule } from '@/types';
import { TemplateListView } from '@/features/templates/TemplateListView';
import { TemplateJsonPreview } from '@/features/templates/TemplateJsonPreview';
import { TemplateDetailDrawer } from '@/features/templates/TemplateDetailDrawer';
import { TemplateRuleModal } from '@/features/templates/TemplateRuleModal';

const { Title, Text } = Typography;

export const TemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  // View Mode: 'list' vs 'json-preview'
  const [viewMode, setViewMode] = useState<string>('list');

  // Preview Mode State
  const [previewTemplateCode, setPreviewTemplateCode] = useState<string>('D10');
  const [previewFields, setPreviewFields] = useState<ReportTemplateField[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

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

  return (
    <div>
      {/* Header Bar */}
      <Card style={{ marginBottom: 16, borderRadius: 8 }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={14}>
            <Title level={4} style={{ margin: 0, color: '#002B66' }}>
              Cấu Hình Biểu Mẫu Báo Cáo & Bộ Quy Tắc Đối Soát (Rule Engine)
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Quản lý danh mục 13 biểu mẫu chính thức theo QĐ 573/NHNN & TT15, quy cách đóng gói JSON Phụ lục II và bộ quy tắc kiểm tra dữ liệu.
            </Text>
          </Col>
          <Col xs={24} md={10} style={{ textAlign: 'right' }}>
            <Space wrap>
              <Segmented
                value={viewMode}
                onChange={(val) => setViewMode(val as string)}
                options={[
                  {
                    label: (
                      <Space>
                        <TableOutlined />
                        <span>Bảng Danh Sách ({templates.length})</span>
                      </Space>
                    ),
                    value: 'list',
                  },
                  {
                    label: (
                      <Space>
                        <CodeOutlined />
                        <span>Mẫu JSON Preview (Phụ Lục II)</span>
                      </Space>
                    ),
                    value: 'json-preview',
                  },
                ]}
              />
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
          templates={templates}
          loading={loading}
          onOpenDetail={handleOpenDetail}
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
    </div>
  );
};
