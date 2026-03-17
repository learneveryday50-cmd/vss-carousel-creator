---
phase: 6
slug: history-downloads-and-export
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None detected — no test files, no jest/vitest config in project |
| **Config file** | none — Wave 0 installs if needed |
| **Quick run command** | N/A until framework installed |
| **Full suite command** | N/A until framework installed |
| **Estimated runtime** | Manual only for v1 |

---

## Sampling Rate

- **After every task commit:** Manual browser verification per task
- **After every plan wave:** Full manual smoke test of completed features
- **Before `/gsd:verify-work`:** All manual verification checklist items must pass
- **Max feedback latency:** Immediate (manual spot-check each task)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 6-01-01 | 01 | 1 | HIST-01, HIST-02 | manual | N/A — browser check | ❌ Wave 0 | ⬜ pending |
| 6-01-02 | 01 | 1 | HIST-03 | manual | N/A — Server Action | ❌ Wave 0 | ⬜ pending |
| 6-02-01 | 02 | 2 | HIST-05 | manual | N/A — file download | ❌ Wave 0 | ⬜ pending |
| 6-02-02 | 02 | 2 | HIST-06 | manual | N/A — file download | ❌ Wave 0 | ⬜ pending |
| 6-02-03 | 02 | 2 | HIST-04 | manual | N/A — clipboard API | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No test framework installation required for this phase — all HIST requirements are UI/browser behaviors that require a real browser environment. The only automated-testable piece is the `/api/download` proxy route (auth guard + URL allowlist), but since there is no test framework in the project, this is deferred to a future phase.

*Existing infrastructure covers all phase requirements via manual verification.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| History page shows carousel list | HIST-01 | Requires authenticated browser session with real data | Navigate to /history, verify carousel grid renders with entries |
| Entry shows brand, template, date | HIST-02 | Requires DB data with brand_name/template_name populated | Check that each card shows brand name, template name, and creation date |
| Delete removes carousel from list | HIST-03 | Server Action + revalidatePath requires browser | Click delete on a carousel, confirm it disappears from the list |
| Copy button writes post body to clipboard | HIST-04 | Requires browser Clipboard API permission | Click copy, paste into text editor, verify post body text matches |
| Individual slide download works | HIST-05 | File download requires browser, CORS proxy must be verified in real context | Click download on a slide, verify file downloads and is not 0 bytes |
| Full PDF export produces valid PDF | HIST-06 | PDF generation requires browser jsPDF, file must open | Click "Download PDF", verify file downloads and opens in PDF viewer with correct slides |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < manual spot-check per task
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
