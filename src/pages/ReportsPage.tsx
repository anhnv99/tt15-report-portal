import React from 'react';
import { Card, Space, Tabs } from 'antd';
import { FileDoneOutlined, PlayCircleOutlined, SendOutlined } from '@ant-design/icons';
import { ReportFilterHeader } from '@/features/reports/ReportFilterHeader';
import { ReportVersionsTab } from '@/features/reports/ReportVersionsTab';
import { ReportAggregationsTab } from '@/features/reports/ReportAggregationsTab';
import { ReportDeliveriesTab } from '@/features/reports/ReportDeliveriesTab';
import { ReportModalsContainer } from '@/features/reports/ReportModalsContainer';
import { useReportsManagement } from '@/features/reports/useReportsManagement';

export const ReportsPage: React.FC = () => {
  const {
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
  } = useReportsManagement();

  return (
    <div>
      {/* Header & Filter Card */}
      <ReportFilterHeader
        templates={templates}
        periods={periods}
        selectedTemplate={selectedTemplate}
        selectedPeriod={selectedPeriod}
        onSelectTemplate={setSelectedTemplate}
        onSelectPeriod={setSelectedPeriod}
      />

      {/* Main Tabs Container */}
      <Card style={{ borderRadius: 8 }} bodyStyle={{ padding: '16px 24px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
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
                  onToggleActive={handleToggleVersionActive}
                  onSend={handleSendApprovedVersion}
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
                  onCreateVersion={handleCreateVersionFromAggregation}
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
      <ReportModalsContainer
        validationDrawerOpen={validationDrawerOpen}
        validationResults={validationResults}
        validationLoading={validationLoading}
        selectedAggId={selectedAggId}
        onCloseValidation={() => setValidationDrawerOpen(false)}

        lineageDrawerOpen={lineageDrawerOpen}
        sourceBatches={sourceBatches}
        lineageLoading={lineageLoading}
        onCloseLineage={() => setLineageDrawerOpen(false)}

        versionEventsOpen={versionEventsOpen}
        versionEvents={versionEvents}
        versionEventsLoading={versionEventsLoading}
        onCloseTimeline={() => setVersionEventsOpen(false)}

        rejectVersionModalOpen={rejectVersionModalOpen}
        rejectVersionId={rejectVersionId}
        onCancelReject={() => setRejectVersionModalOpen(false)}
        onSubmitReject={handleRejectVersionSubmit}

        artifactModalOpen={artifactModalOpen}
        selectedVersion={selectedVersion}
        artifactsList={artifactsList}
        artifactsLoading={artifactsLoading}
        generatingArtifact={generatingArtifact}
        onCancelArtifact={() => setArtifactModalOpen(false)}
        onGenerateArtifact={handleGenerateArtifact}

        manualAggModalOpen={manualAggModalOpen}
        approvedBatches={approvedBatches}
        selectedBatchIds={selectedBatchIds}
        batchLoading={batchLoading}
        submittingManualAgg={submittingManualAgg}
        onCancelManualAgg={() => setManualAggModalOpen(false)}
        onBatchSelectionChange={setSelectedBatchIds}
        onSubmitManualAgg={handleManualAggregateSubmit}

        adjustModalOpen={adjustModalOpen}
        adjustVersion={adjustVersion}
        onCloseAdjust={() => setAdjustModalOpen(false)}
        onAdjustSuccess={loadReportData}
      />
    </div>
  );
};
