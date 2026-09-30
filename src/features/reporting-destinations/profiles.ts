import { CIC_DESTINATION_PROFILE } from './cic';
import { PCB_DESTINATION_PROFILE } from './pcb';
import { SBV_DESTINATION_PROFILE } from './sbv';
import type { ReportDestination, ReportDestinationProfile } from './types';

export const REPORT_DESTINATION_PROFILES: Record<ReportDestination, ReportDestinationProfile> = {
  CIC: CIC_DESTINATION_PROFILE,
  SBV: SBV_DESTINATION_PROFILE,
  PCB: PCB_DESTINATION_PROFILE,
};

export const getReportDestinationProfile = (destination: ReportDestination): ReportDestinationProfile =>
  REPORT_DESTINATION_PROFILES[destination];
