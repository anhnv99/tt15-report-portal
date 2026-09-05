import React from 'react';
import type {
  ValidationResult,
  AggregationSourceBatch,
  CicReportEvent,
  CicReportVersion,
  ReportArtifact,
  ImportBatch,
} from '@/types';
import { ValidationResultsDrawer } from '@/features/reports/ValidationResultsDrawer';
import { AggregationLineageDrawer } from '@/features/reports/AggregationLineageDrawer';
import { VersionTimelineDrawer } from '@/features/reports/VersionTimelineDrawer';
import { RejectVersionModal } from '@/features/reports/RejectVersionModal';
import { ArtifactModal } from '@/features/reports/ArtifactModal';
import { ManualAggregationModal } from '@/features/reports/ManualAggregationModal';
import { ReportAdjustmentModal } from '@/features/reports/ReportAdjustmentModal';

interface ReportModalsContainerProps {
  // Validation Drawer
  validationDrawerOpen: boolean;
  validationResults: ValidationResult[];
  validationLoading: boolean;
  selectedAggId: string;
  onCloseValidation: () => void;

  // Lineage Drawer
  lineageDrawerOpen: boolean;
  sourceBatches: AggregationSourceBatch[];
  lineageLoading: boolean;
  onCloseLineage: () => void;

  // Timeline Drawer
  versionEventsOpen: boolean;
  versionEvents: CicReportEvent[];
  versionEventsLoading: boolean;
  onCloseTimeline: () => void;

  // Reject Modal
  rejectVersionModalOpen: boolean;
  rejectVersionId: string;
  onCancelReject: () => void;
  onSubmitReject: (versionId: string, reason: string) => Promise<void>;

  // Artifact Modal
  artifactModalOpen: boolean;
  selectedVersion: CicReportVersion | null;
  artifactsList: ReportArtifact[];
  artifactsLoading: boolean;
  generatingArtifact: boolean;
  onCancelArtifact: () => void;
  onGenerateArtifact: () => Promise<void>;

  // Manual Aggregation Modal
  manualAggModalOpen: boolean;
  approvedBatches: ImportBatch[];
  selectedBatchIds: string[];
  batchLoading: boolean;
  submittingManualAgg: boolean;
  onCancelManualAgg: () => void;
  onBatchSelectionChange: (ids: string[]) => void;
  onSubmitManualAgg: () => Promise<void>;

  // Adjustment Modal
  adjustModalOpen: boolean;
  adjustVersion: CicReportVersion | null;
  onCloseAdjust: () => void;
  onAdjustSuccess: () => void;
}

export const ReportModalsContainer: React.FC<ReportModalsContainerProps> = ({
  validationDrawerOpen,
  validationResults,
  validationLoading,
  selectedAggId,
  onCloseValidation,

  lineageDrawerOpen,
  sourceBatches,
  lineageLoading,
  onCloseLineage,

  versionEventsOpen,
  versionEvents,
  versionEventsLoading,
  onCloseTimeline,

  rejectVersionModalOpen,
  rejectVersionId,
  onCancelReject,
  onSubmitReject,

  artifactModalOpen,
  selectedVersion,
  artifactsList,
  artifactsLoading,
  generatingArtifact,
  onCancelArtifact,
  onGenerateArtifact,

  manualAggModalOpen,
  approvedBatches,
  selectedBatchIds,
  batchLoading,
  submittingManualAgg,
  onCancelManualAgg,
  onBatchSelectionChange,
  onSubmitManualAgg,

  adjustModalOpen,
  adjustVersion,
  onCloseAdjust,
  onAdjustSuccess,
}) => {
  return (
    <>
      <ValidationResultsDrawer
        open={validationDrawerOpen}
        results={validationResults}
        loading={validationLoading}
        aggregationId={selectedAggId}
        onClose={onCloseValidation}
      />

      <AggregationLineageDrawer
        open={lineageDrawerOpen}
        batches={sourceBatches}
        loading={lineageLoading}
        onClose={onCloseLineage}
      />

      <VersionTimelineDrawer
        open={versionEventsOpen}
        events={versionEvents}
        loading={versionEventsLoading}
        onClose={onCloseTimeline}
      />

      <RejectVersionModal
        open={rejectVersionModalOpen}
        versionId={rejectVersionId}
        onCancel={onCancelReject}
        onSubmit={onSubmitReject}
      />

      <ArtifactModal
        open={artifactModalOpen}
        version={selectedVersion}
        artifacts={artifactsList}
        loading={artifactsLoading}
        generating={generatingArtifact}
        onCancel={onCancelArtifact}
        onGenerate={onGenerateArtifact}
      />

      <ManualAggregationModal
        open={manualAggModalOpen}
        batches={approvedBatches}
        selectedBatchIds={selectedBatchIds}
        loading={batchLoading}
        submitting={submittingManualAgg}
        onCancel={onCancelManualAgg}
        onSelectionChange={onBatchSelectionChange}
        onSubmit={onSubmitManualAgg}
      />

      <ReportAdjustmentModal
        open={adjustModalOpen}
        version={adjustVersion}
        onClose={onCloseAdjust}
        onSuccess={onAdjustSuccess}
      />
    </>
  );
};
