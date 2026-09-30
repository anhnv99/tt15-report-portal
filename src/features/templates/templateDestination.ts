import type { ReportTemplate } from '@/types';
import { normalizeReportDestination, resolveTemplateDestination } from '@/features/reporting-destinations/resolveReportDestination';

export const normalizeTemplateDestination = normalizeReportDestination;

export const matchesTemplateDestination = (
  template: Pick<ReportTemplate, 'targetDestination'>,
  filter: string,
): boolean => filter === 'ALL' || normalizeTemplateDestination(template.targetDestination) === filter;

export { resolveTemplateDestination };
