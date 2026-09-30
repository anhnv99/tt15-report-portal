# Report Destination Modules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep CIC, SBV, and PCB reporting workflows independently configurable while preserving one shared application shell.

**Architecture:** A small destination registry owns normalization, visual labels, artifact defaults, and capability flags. Screens resolve a report's destination once and render from that profile; destination-only panels live in separate feature folders rather than branching on report code or filename extensions.

**Tech Stack:** React 19, TypeScript, Ant Design 6, Vite.

## Global Constraints

- CIC, SBV, and PCB are independent business destinations.
- Never infer destination from a generated file extension.
- Existing API payloads without a destination retain the legacy report-code fallback.
- Preserve existing uncommitted work outside files listed in each task.
- The repository has no `npm test` script; use `npm run typecheck`, `npm run lint`, and `npm run build` for executable verification until a test runner is introduced.

---

### Task 1: Destination registry

**Files:**
- Create: `src/features/reporting-destinations/types.ts`
- Create: `src/features/reporting-destinations/profiles.ts`
- Create: `src/features/reporting-destinations/resolveReportDestination.ts`
- Modify: `src/features/templates/templateDestination.ts`
- Modify: `src/types/index.ts`

**Produces:** `ReportDestination`, `getReportDestinationProfile`, `resolveReportDestination`, `resolveTemplateDestination`, and `resolveVersionDestination`.

- [ ] Define the three supported destination literals and profile interface.
- [ ] Define CIC, SBV, and PCB profiles with separate default artifact, label, tag color, and capability flags.
- [ ] Normalize legacy `SVB` to `SBV`, resolve template payloads first by destination, then use one legacy report-code fallback.
- [ ] Add optional `targetDestination` to report versions so new API payloads can select the correct workflow directly.
- [ ] Verify with `npm run typecheck`.

### Task 2: Use destination profiles in template entry points

**Files:**
- Modify: `src/pages/TemplatesPage.tsx`
- Modify: `src/features/templates/TemplateListView.tsx`
- Modify: `src/features/templates/CreateTemplateModal.tsx`

**Consumes:** `REPORT_DESTINATION_PROFILES`, `resolveTemplateDestination`.

- [ ] Generate the destination filter options from the registry.
- [ ] Render each template's destination tag and secondary action from its profile.
- [ ] Make template defaults/root structure selection resolve through the profile rather than local CIC/SBV condition chains.
- [ ] Verify with `npm run typecheck`.

### Task 3: Use destination profiles in report output and delivery

**Files:**
- Modify: `src/features/reports/ArtifactModal.tsx`
- Modify: `src/features/reports/ReportVersionsTab.tsx`
- Modify: `src/features/reports/ReportDeliveriesTab.tsx`
- Modify: `src/features/reports/ReportFilterHeader.tsx`

**Consumes:** `resolveVersionDestination`, `getReportDestinationProfile`.

- [ ] Remove filename-extension inference for SBV.
- [ ] Resolve artifact labels, filename defaults, send labels, tags, and destination selection from the profile.
- [ ] Restrict the Excel adjustment/export action to the SBV profile; leave CIC and PCB with their own artifacts and normal delivery flow.
- [ ] Verify with `npm run typecheck` and `npm run build`.

### Task 4: Split destination-only form sections

**Files:**
- Create: `src/features/templates/destinations/cic/`
- Create: `src/features/templates/destinations/sbv/`
- Create: `src/features/templates/destinations/pcb/`
- Modify: `src/features/templates/TemplateDetailDrawer.tsx`
- Modify: `src/features/reports/ReportAdjustmentModal.tsx`

**Consumes:** `ReportDestinationProfile`.

- [ ] Extract only destination-specific form content from the shared drawer/modal, retaining common drawer chrome, field persistence, rule management, and audit UI.
- [ ] Keep SBV's Excel mapping and workbook adjustments inside the SBV module.
- [ ] Give CIC and PCB their own panel files, even if their initial configuration is intentionally minimal.
- [ ] Verify with `npm run typecheck`, `npm run lint`, and `npm run build`.

