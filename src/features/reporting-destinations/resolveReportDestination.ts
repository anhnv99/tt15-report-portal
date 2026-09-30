import type { CicReportVersion, ReportTemplate } from '@/types';
import { detectAgencyFromReportCode } from '@/utils/namingRuleUtil';

import { getReportDestinationProfile } from './profiles';
import type { ReportDestination, ReportDestinationProfile } from './types';

export const normalizeReportDestination = (value?: string): ReportDestination => {
  const normalized = value?.trim().toUpperCase();
  if (normalized === 'SBV' || normalized === 'SVB') return 'SBV';
  if (normalized === 'PCB') return 'PCB';
  return 'CIC';
};

export const resolveTemplateDestination = (
  template: Pick<ReportTemplate, 'targetDestination' | 'reportCode'>,
): ReportDestination => template.targetDestination
  ? normalizeReportDestination(template.targetDestination)
  : detectAgencyFromReportCode(template.reportCode);

export const resolveVersionDestination = (
  version: Pick<CicReportVersion, 'targetDestination' | 'reportCode'>,
): ReportDestination => version.targetDestination
  ? normalizeReportDestination(version.targetDestination)
  : detectAgencyFromReportCode(version.reportCode);

export const getTemplateDestinationProfile = (template: Pick<ReportTemplate, 'targetDestination' | 'reportCode'>): ReportDestinationProfile =>
  getReportDestinationProfile(resolveTemplateDestination(template));

export const getVersionDestinationProfile = (version: Pick<CicReportVersion, 'targetDestination' | 'reportCode'>): ReportDestinationProfile =>
  getReportDestinationProfile(resolveVersionDestination(version));
