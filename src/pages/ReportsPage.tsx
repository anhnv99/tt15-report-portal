import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Select, Typography, Space, Tabs, message } from 'antd';
import { FileDoneOutlined, PlayCircleOutlined, SendOutlined } from '@ant-design/icons';
import { reportingApi } from '@/api/reporting.api';
import { catalogApi } from '@/api/catalog.api';
import { importApi } from '@/api/import.api';
import type {
  ReportTemplate,
  DataPeriod,
  CicReportVersion,
  CicReportEvent,
  ReportAggregation,
  AggregationSourceBatch,
  ReportArtifact,
  ValidationResult,
  ReportDelivery,
  ImportBatch,
} from '@/types';
import { ReportVersionsTab } from '@/features/reports/ReportVersionsTab';
import { ReportAggregationsTab } from '@/features/reports/ReportAggregationsTab';
import { ReportDeliveriesTab } from '@/features/reports/ReportDeliveriesTab';
import { ValidationResultsDrawer } from '@/features/reports/ValidationResultsDrawer';
import { AggregationLineageDrawer } from '@/features/reports/AggregationLineageDrawer';
import { VersionTimelineDrawer } from '@/features/reports/VersionTimelineDrawer';
import { RejectVersionModal } from '@/features/reports/RejectVersionModal';
import { ArtifactModal } from '@/features/reports/ArtifactModal';
import { ManualAggregationModal } from '@/features/reports/ManualAggregationModal';
import { ReportAdjustmentModal } from '@/features/reports/ReportAdjustmentModal';

const { Title, Text } = Typography;

export const ReportsPage: React.FC = () => {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [periods, setPeriods] = useState<DataPeriod[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('D10');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');

  const [versions, setVersions] = useState<CicReportVersion[]>([]);
  const [aggregations, setAggregations] = useState<ReportAggregation[]>([]);
  const [deliveries, setDeliveries] = useState<ReportDelivery[]>([]);
  const [loading, setLoading] = useState(false);

  // Lineage Drawer State
  const [lineageDrawerOpen, setLineageDrawerOpen] = useState(false);
  const [sourceBatches, setSourceBatches] = useState<AggregationSourceBatch[]>([]);
  const [lineageLoading, setLineageLoading] = useState(false);

  // Validation Results Drawer State
  const [validationDrawerOpen, setValidationDrawerOpen] = useState(false);
  const [selectedAggId, setSelectedAggId] = useState<string>('');
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [validationLoading, setValidationLoading] = useState(false);

  // Version Timeline Drawer State
  const [versionEventsOpen, setVersionEventsOpen] = useState(false);
  const [versionEvents, setVersionEvents] = useState<CicReportEvent[]>([]);
  const [versionEventsLoading, setVersionEventsLoading] = useState(false);

  // Version Reject Modal State
  const [rejectVersionModalOpen, setRejectVersionModalOpen] = useState(false);
  const [rejectVersionId, setRejectVersionId] = useState<string>('');

  // Report Adjustment Modal State
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustVersion, setAdjustVersion] = useState<CicReportVersion | null>(null);

  // Artifact Modal State
  const [artifactModalOpen, setArtifactModalOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<CicReportVersion | null>(null);
  const [artifactsList, setArtifactsList] = useState<ReportArtifact[]>([]);
  const [generatingArtifact, setGeneratingArtifact] = useState(false);
  const [artifactsLoading, setArtifactsLoading] = useState(false);

  // Manual Aggregation Modal State
  const [manualAggModalOpen, setManualAggModalOpen] = useState(false);
  const [approvedBatches, setApprovedBatches] = useState<ImportBatch[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [submittingManualAgg, setSubmittingManualAgg] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      loadReportData();
    }
  }, [selectedTemplate, selectedPeriod]);

  const loadInitialData = async () => {
    try {
      const [tplData, prdData] = await Promise.all([
        catalogApi.getReportTemplates(),
        catalogApi.getDataPeriods(),
      ]);
      setTemplates(tplData || []);
      setPeriods(prdData || []);
      if (tplData?.length && !selectedTemplate) {
        setSelectedTemplate(tplData[0].reportCode);
      }
      if (prdData?.length && !selectedPeriod) {
        setSelectedPeriod(prdData[0].code);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadReportData = async () => {
    try {
      setLoading(true);
      const [verData, aggData, delData] = await Promise.all([
        reportingApi.getCicReportVersions({
          reportCode: selectedTemplate,
          dataPeriodCode: selectedPeriod || undefined,
        }),
        reportingApi.getAggregations({
          reportCode: selectedTemplate,
          dataPeriodCode: selectedPeriod || undefined,
        }),
        reportingApi.getReportDeliveries().catch(() => []),
      ]);
      setVersions(verData || []);
      setAggregations(aggData || []);
      setDeliveries(delData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Auto Aggregation
  const handleAutoAggregate = async () => {
    if (!selectedTemplate || !selectedPeriod) {
      message.warning('Vui lòng chọn Biểu mẫu và Kỳ dữ liệu');
      return;
    }
    try {
      setLoading(true);
      await reportingApi.createAutomaticAggregation({
        reportCode: selectedTemplate,
        dataPeriodCode: selectedPeriod,
      });
      message.success('Đã khởi tạo quy trình tổng hợp tự động thành công!');
      loadReportData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Manual Aggregation Open & Submit
  const handleOpenManualAggregation = async () => {
    if (!selectedTemplate || !selectedPeriod) {
      message.warning('Vui lòng chọn Biểu mẫu và Kỳ dữ liệu');
      return;
    }
    setManualAggModalOpen(true);
    setSelectedBatchIds([]);
    try {
      setBatchLoading(true);
      const periodObj = periods.find((p) => p.code === selectedPeriod);
      const batches = await importApi.getImportBatches({
        importType: selectedTemplate,
        status: 'APPROVED',
        dataPeriodId: periodObj?.id,
      });
      setApprovedBatches(batches || []);
    } catch (err) {
      console.error(err);
    } finally {
      setBatchLoading(false);
    }
  };

  const handleManualAggregateSubmit = async () => {
    if (!selectedBatchIds.length) {
      message.warning('Vui lòng chọn ít nhất một lô nguồn đã duyệt');
      return;
    }
    try {
      setSubmittingManualAgg(true);
      await reportingApi.createManualAggregation({
        reportCode: selectedTemplate,
        dataPeriodCode: selectedPeriod,
        batchIds: selectedBatchIds,
      });
      message.success('Đã khởi tạo đợt tổng hợp thủ công thành công!');
      setManualAggModalOpen(false);
      loadReportData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingManualAgg(false);
    }
  };

  // Run Rules Check
  const handleRunRulesCheck = async (aggId: string) => {
    try {
      setLoading(true);
      await reportingApi.evaluateReportChecks({
        aggregationId: aggId,
        reportCode: selectedTemplate,
        values: {},
      });
      message.success('Đã thực thi kiểm tra xong');
      handleOpenValidation(aggId);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Open Lineage Drawer
  const handleOpenLineage = async (aggId: string) => {
    setLineageDrawerOpen(true);
    try {
      setLineageLoading(true);
      const data = await reportingApi.getAggregationSources(aggId);
      setSourceBatches(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLineageLoading(false);
    }
  };

  // Open Validation Drawer
  const handleOpenValidation = async (aggId: string) => {
    setSelectedAggId(aggId);
    setValidationDrawerOpen(true);
    try {
      setValidationLoading(true);
      const data = await reportingApi.getValidationResults(aggId);
      setValidationResults(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setValidationLoading(false);
    }
  };

  // Version Approvals
  const handleApproveVersion = async (versionId: string) => {
    try {
      await reportingApi.approveCicReportVersion(versionId);
      message.success('Đã phê duyệt phiên bản báo cáo thành công!');
      loadReportData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectVersionSubmit = async (versionId: string, reason: string) => {
    await reportingApi.rejectCicReportVersion(versionId, reason);
    message.success('Đã từ chối phiên bản báo cáo');
    setRejectVersionModalOpen(false);
    loadReportData();
  };

  const handleOpenTimeline = async (versionId: string) => {
    setVersionEventsOpen(true);
    try {
      setVersionEventsLoading(true);
      const data = await reportingApi.getVersionEvents(versionId);
      setVersionEvents(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setVersionEventsLoading(false);
    }
  };

  // Artifacts
  const handleOpenArtifacts = async (version: CicReportVersion) => {
    setSelectedVersion(version);
    setArtifactModalOpen(true);
    loadArtifacts(version.id);
  };

  const loadArtifacts = async (versionId: string) => {
    try {
      setArtifactsLoading(true);
      const data = await reportingApi.getArtifactsByVersionId(versionId);
      setArtifactsList(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setArtifactsLoading(false);
    }
  };

  const handleGenerateArtifact = async () => {
    if (!selectedVersion) return;
    try {
      setGeneratingArtifact(true);
      await reportingApi.generateArtifacts({
        reportCode: selectedTemplate,
        aggregationId: selectedVersion.aggregationId,
        reportingUnitCode: '79301001',
        reportingDate: selectedVersion.reportingDate || new Date().toISOString().slice(0, 10),
        reporterName: 'He thong tu dong',
        reporterPhone: '0901234567',
        reporterEmail: 'admin@bank.com',
        sequence: selectedVersion.versionNumber,
        reportVersionId: selectedVersion.id,
      });
      message.success('Đã đóng gói thành công tệp báo cáo chuẩn CIC');
      loadArtifacts(selectedVersion.id);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingArtifact(false);
    }
  };

  // Deliveries
  const handleDispatch = async (deliveryId: string) => {
    try {
      await reportingApi.dispatchReportDelivery({ reportVersionId: deliveryId });
      message.success('Đã kích hoạt gửi tệp báo cáo sang CIC!');
      setTimeout(() => loadReportData(), 1200);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRetry = async (deliveryId: string) => {
    try {
      await reportingApi.retryReportDelivery(deliveryId);
      message.success('Đã gửi lại tệp báo cáo sang CIC');
      setTimeout(() => loadReportData(), 1200);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendApprovedVersion = async (version: CicReportVersion) => {
    try {
      await reportingApi.dispatchReportDelivery({ reportVersionId: version.id });
      message.success(`Đã nộp phiên bản v${version.versionNumber} sang luồng truyền nhận CIC!`);
      setTimeout(() => loadReportData(), 1000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {/* Header & Filter Card */}
      <Card style={{ marginBottom: 16, borderRadius: 8 }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Title level={4} style={{ margin: 0, color: '#002B66' }}>
              Quản Lý Báo Cáo TT15 / QĐ573 (Maker - Checker Workflow)
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Quy trình khép kín: Tổng hợp dữ liệu $\rightarrow$ Kiểm tra Rules $\rightarrow$ Phê duyệt Maker-Checker $\rightarrow$ Đóng gói ZIP $\rightarrow$ Truyền nhận CIC.
            </Text>
          </Col>
          <Col xs={24} md={12} style={{ textAlign: 'right' }}>
            <Space wrap>
              <Select
                value={selectedTemplate}
                onChange={(val) => setSelectedTemplate(val)}
                style={{ width: 340, textAlign: 'left' }}
                showSearch
                optionFilterProp="children"
              >
                {templates.map((t) => (
                  <Select.Option key={t.reportCode} value={t.reportCode}>
                    <Text strong style={{ color: '#003B95' }}>[{t.reportCode}]</Text> Mẫu {t.templateNumber} - {t.reportName}
                  </Select.Option>
                ))}
              </Select>

              <Select
                value={selectedPeriod}
                onChange={(val) => setSelectedPeriod(val)}
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

      {/* Main Tabs Container */}
      <Card style={{ borderRadius: 8 }} bodyStyle={{ padding: '16px 24px' }}>
        <Tabs
          defaultActiveKey="versions"
          items={[
            {
              key: 'versions',
              label: (
                <Space>
                  <FileDoneOutlined />
                  <span>Phiên Bản Báo Cáo & Phê Duyệt ({versions.length})</span>
                </Space>
              ),
              children: (
                <ReportVersionsTab
                  versions={versions}
                  loading={loading}
                  onApprove={handleApproveVersion}
                  onOpenReject={(id) => {
                    setRejectVersionId(id);
                    setRejectVersionModalOpen(true);
                  }}
                  onOpenArtifacts={handleOpenArtifacts}
                  onOpenTimeline={handleOpenTimeline}
                  onOpenAdjust={(v) => {
                    setAdjustVersion(v);
                    setAdjustModalOpen(true);
                  }}
                />
              ),
            },
            {
              key: 'aggregations',
              label: (
                <Space>
                  <PlayCircleOutlined />
                  <span>Lịch Sử Tổng Hợp Dữ Liệu ({aggregations.length})</span>
                </Space>
              ),
              children: (
                <ReportAggregationsTab
                  aggregations={aggregations}
                  loading={loading}
                  onAutoAggregate={handleAutoAggregate}
                  onOpenManualAggregation={handleOpenManualAggregation}
                  onRunRulesCheck={handleRunRulesCheck}
                  onOpenLineage={handleOpenLineage}
                  onOpenValidation={handleOpenValidation}
                />
              ),
            },
            {
              key: 'deliveries',
              label: (
                <Space>
                  <SendOutlined />
                  <span>Truyền Nhận & Lịch Trình CIC ({deliveries.length})</span>
                </Space>
              ),
              children: (
                <ReportDeliveriesTab
                  deliveries={deliveries}
                  versions={versions}
                  loading={loading}
                  onDispatch={handleDispatch}
                  onRetry={handleRetry}
                  onSendApprovedVersion={handleSendApprovedVersion}
                />
              ),
            },
          ]}
        />
      </Card>

      {/* Drawers & Modals */}
      <ValidationResultsDrawer
        open={validationDrawerOpen}
        results={validationResults}
        loading={validationLoading}
        aggregationId={selectedAggId}
        onClose={() => setValidationDrawerOpen(false)}
      />

      <AggregationLineageDrawer
        open={lineageDrawerOpen}
        batches={sourceBatches}
        loading={lineageLoading}
        onClose={() => setLineageDrawerOpen(false)}
      />

      <VersionTimelineDrawer
        open={versionEventsOpen}
        events={versionEvents}
        loading={versionEventsLoading}
        onClose={() => setVersionEventsOpen(false)}
      />

      <RejectVersionModal
        open={rejectVersionModalOpen}
        versionId={rejectVersionId}
        onCancel={() => setRejectVersionModalOpen(false)}
        onSubmit={handleRejectVersionSubmit}
      />

      <ArtifactModal
        open={artifactModalOpen}
        version={selectedVersion}
        artifacts={artifactsList}
        loading={artifactsLoading}
        generating={generatingArtifact}
        onCancel={() => setArtifactModalOpen(false)}
        onGenerate={handleGenerateArtifact}
      />

      <ManualAggregationModal
        open={manualAggModalOpen}
        batches={approvedBatches}
        selectedBatchIds={selectedBatchIds}
        loading={batchLoading}
        submitting={submittingManualAgg}
        onCancel={() => setManualAggModalOpen(false)}
        onSelectionChange={(ids) => setSelectedBatchIds(ids)}
        onSubmit={handleManualAggregateSubmit}
      />

      <ReportAdjustmentModal
        open={adjustModalOpen}
        version={adjustVersion}
        onClose={() => setAdjustModalOpen(false)}
        onSuccess={loadReportData}
      />
    </div>
  );
};
