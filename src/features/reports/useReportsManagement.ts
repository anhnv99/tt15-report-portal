import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
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

export const useReportsManagement = () => {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [periods, setPeriods] = useState<DataPeriod[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('D10');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');

  const [versions, setVersions] = useState<CicReportVersion[]>([]);
  const [aggregations, setAggregations] = useState<ReportAggregation[]>([]);
  const [deliveries, setDeliveries] = useState<ReportDelivery[]>([]);
  const [loading, setLoading] = useState(false);

  // Tabs State
  const [activeTab, setActiveTab] = useState<string>('versions');

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

  const loadInitialData = useCallback(async () => {
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
  }, [selectedTemplate, selectedPeriod]);

  const loadReportData = useCallback(async () => {
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
  }, [selectedTemplate, selectedPeriod]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (selectedTemplate) {
      loadReportData();
    }
  }, [selectedTemplate, selectedPeriod, loadReportData]);

  // Auto Aggregation
  const handleAutoAggregate = async () => {
    if (!selectedTemplate || !selectedPeriod) {
      message.warning('Vui lòng chọn Biểu mẫu và Kỳ dữ liệu');
      return;
    }
    const periodObj = periods.find((p) => p.code === selectedPeriod);
    if (!periodObj) {
      message.warning('Không tìm thấy thông tin kỳ dữ liệu được chọn');
      return;
    }
    try {
      setLoading(true);
      await reportingApi.createAutomaticAggregation({
        reportCode: selectedTemplate,
        dataPeriodId: periodObj.id,
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
    const periodObj = periods.find((p) => p.code === selectedPeriod);
    if (!periodObj) {
      message.warning('Không tìm thấy thông tin kỳ dữ liệu được chọn');
      return;
    }
    try {
      setSubmittingManualAgg(true);
      await reportingApi.createManualAggregation({
        reportCode: selectedTemplate,
        dataPeriodId: periodObj.id,
        fromDate: periodObj.startDate,
        toDate: periodObj.endDate,
        sourceBatchIds: selectedBatchIds,
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

  // Create CIC Report Version from Completed Aggregation
  const handleCreateVersionFromAggregation = async (agg: ReportAggregation) => {
    const periodObj = periods.find((p) => p.code === agg.dataPeriodCode) || periods[0];
    const nextVersion = versions.filter((v) => v.reportCode === agg.reportCode).length + 1;
    try {
      setLoading(true);
      await reportingApi.createCicReportVersion({
        reportCode: agg.reportCode,
        dataPeriodId: periodObj ? periodObj.id : (agg as any).dataPeriodId,
        aggregationId: agg.id,
        versionNumber: nextVersion,
        reportingDate: periodObj ? periodObj.endDate : new Date().toISOString().slice(0, 10),
      });
      message.success(`Đã tạo thành công Phiên bản Báo cáo v${nextVersion}!`);
      await loadReportData();
      setActiveTab('versions');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
    message.success('Đã từ chối phiên bản báo cáo!');
    setRejectVersionModalOpen(false);
    loadReportData();
  };

  const handleToggleVersionActive = async (versionId: string) => {
    try {
      await reportingApi.toggleVersionActive(versionId);
      message.success('Cập nhật trạng thái hiệu lực phiên bản thành công!');
      loadReportData();
    } catch (err: any) {
      console.error(err);
      message.error(err?.response?.data?.message || 'Không thể cập nhật trạng thái');
    }
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

  const handleOpenArtifacts = async (version: CicReportVersion) => {
    setSelectedVersion(version);
    setArtifactModalOpen(true);
    loadArtifacts(version.id);
  };

  const handleGenerateArtifact = async () => {
    if (!selectedVersion) return;
    try {
      setGeneratingArtifact(true);
      const formattedDate = (selectedVersion.reportingDate || new Date().toISOString().slice(0, 10)).replace(/[^0-9]/g, '');
      await reportingApi.generateArtifacts({
        reportCode: selectedTemplate,
        aggregationId: selectedVersion.aggregationId,
        reportingUnitCode: '79301001',
        reportingDate: formattedDate,
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

  const handleSendApprovedVersion = async (version: CicReportVersion, destination: string = 'CIC') => {
    try {
      await reportingApi.dispatchReportDelivery({ reportVersionId: version.id, destination });
      message.success(`Đã nộp phiên bản v${version.versionNumber} sang kênh ${destination.toUpperCase()}!`);
      setTimeout(() => loadReportData(), 1000);
    } catch (err) {
      console.error(err);
    }
  };

  return {
    templates,
    periods,
    selectedTemplate,
    setSelectedTemplate,
    selectedPeriod,
    setSelectedPeriod,
    versions,
    aggregations,
    deliveries,
    loading,
    activeTab,
    setActiveTab,
    loadReportData,

    // Lineage Drawer
    lineageDrawerOpen,
    setLineageDrawerOpen,
    sourceBatches,
    lineageLoading,
    handleOpenLineage,

    // Validation Drawer
    validationDrawerOpen,
    setValidationDrawerOpen,
    selectedAggId,
    validationResults,
    validationLoading,
    handleOpenValidation,
    handleRunRulesCheck,

    // Version Timeline
    versionEventsOpen,
    setVersionEventsOpen,
    versionEvents,
    versionEventsLoading,
    handleOpenTimeline,

    // Reject Modal
    rejectVersionModalOpen,
    setRejectVersionModalOpen,
    rejectVersionId,
    setRejectVersionId,
    handleRejectVersionSubmit,

    // Adjust Modal
    adjustModalOpen,
    setAdjustModalOpen,
    adjustVersion,
    setAdjustVersion,

    // Artifact Modal
    artifactModalOpen,
    setArtifactModalOpen,
    selectedVersion,
    artifactsList,
    generatingArtifact,
    artifactsLoading,
    handleOpenArtifacts,
    handleGenerateArtifact,

    // Manual Aggregation Modal
    manualAggModalOpen,
    setManualAggModalOpen,
    approvedBatches,
    selectedBatchIds,
    setSelectedBatchIds,
    batchLoading,
    submittingManualAgg,
    handleOpenManualAggregation,
    handleManualAggregateSubmit,

    // Additional Handlers
    handleAutoAggregate,
    handleCreateVersionFromAggregation,
    handleApproveVersion,
    handleToggleVersionActive,
    handleDispatch,
    handleRetry,
    handleSendApprovedVersion,
  };
};
