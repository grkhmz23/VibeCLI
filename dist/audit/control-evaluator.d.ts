import type { AuditControl, AuditMappedControl, AuditEvidenceRef } from "./types.js";
export declare function evaluateControl(control: AuditControl, evidenceBySource: Map<string, AuditEvidenceRef[]>): AuditMappedControl;
