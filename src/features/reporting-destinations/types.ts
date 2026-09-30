export const REPORT_DESTINATIONS = ['CIC', 'SBV', 'PCB'] as const;

export type ReportDestination = (typeof REPORT_DESTINATIONS)[number];

export interface ReportDestinationProfile {
  id: ReportDestination;
  label: string;
  deliveryLabel: string;
  tagColor: 'blue' | 'green' | 'purple';
  defaultArtifactExtension: 'json' | 'xlsx' | 'zip';
  artifactDescription: string;
  supportsJsonSchema: boolean;
  supportsExcelMapping: boolean;
  supportsWorkbookAdjustment: boolean;
  defaultReportCode: string;
  getDefaultRootStructure: (reportCode: string) => string;
}
