import * as XLSX from "xlsx";
import { format, parseISO } from "date-fns";
import type { AppState, BtsMasterRecord, OutageIncident, RawAlarmRecord, Site } from "./types";
import { availabilityForSite } from "./availability";

const COLUMN_ALIASES: Record<string, string[]> = {
  circle: ["circle", "circle id", "circle i"],
  ssa: ["ssa name", "ssa nar", "ssa na", "ssa", "ssa id"],
  sdca: ["sdca name", "sdca na", "sdca nar", "sdca", "sdca id"],
  btsId: ["bts ip id", "bts ip", "ip id", "ipid", "ip", "bts id", "btsid", "bts i", "site id"],
  btsName: ["bts name", "btsname", "bts nam", "bts na", "site name"],
  ipId: ["bts ip", "ip id", "ipid", "ip"],
  technology: ["bts typ", "technology", "tech"],
  siteType: ["site typ", "site type", "bts site", "type"],
  downTime: ["bts down dt", "bts dow", "bts down", "down time", "downtime", "down"],
  upTime: ["bts up dt", "bts up", "up time", "uptime", "up"],
  duration: ["dur", "duration", "duration minutes", "outage duration"],
  alarmCode: ["alarm c", "alarm code", "alarm"],
  vendor: ["vendor name", "vendor", "vend"],
  description: ["descrip", "description", "alarm description"],
  additionalInfo: ["addl info", "addi in", "additional info", "additional"],
  faultType: ["fault ty", "fault type"]
};

function norm(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function pickFromRow(row: Record<string, unknown>, aliases: string[]) {
  const byNorm = Object.fromEntries(Object.entries(row).map(([key, value]) => [norm(key), value]));
  const hit = aliases.map(norm).find((alias) => alias in byNorm);
  return hit ? String(byNorm[hit] ?? "").trim() : "";
}

function parsePerson(value: string) {
  const normalized = value.replace(/\u2013|\u2014/g, "-");
  const parts = normalized.split("-").map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) return { staffNo: parts[0], name: parts.slice(1).join(" - ") };
  return { staffNo: "", name: normalized.trim() };
}

export function readRowsFromWorkbook(file: File): Promise<Record<string, unknown>[]> {
  return file.arrayBuffer().then((buffer) => {
    const workbook = XLSX.read(buffer);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });
  });
}

export function normalizeRows(rows: Record<string, unknown>[], batchId: string): RawAlarmRecord[] {
  return rows.map((row, index) => {
    const byNorm = Object.fromEntries(Object.entries(row).map(([key, value]) => [norm(key), value]));
    const pick = (field: keyof typeof COLUMN_ALIASES) => {
      const hit = COLUMN_ALIASES[field].map(norm).find((alias) => alias in byNorm);
      return hit ? String(byNorm[hit] ?? "").trim() : "";
    };
    const downTime = coerceDate(pick("downTime"));
    const upTime = coerceDate(pick("upTime"));
    const duration = Number(pick("duration")) || Math.max(0, (Date.parse(upTime) - Date.parse(downTime)) / 60000);
    const description = [pick("description"), pick("additionalInfo"), pick("faultType")].filter(Boolean).join(" - ");
    return {
      id: `raw-${batchId}-${index + 1}`,
      batchId,
      sourceRowNumber: index + 2,
      raw: row as Record<string, string | number | null>,
      normalized: {
        circle: pick("circle"),
        ssa: pick("ssa") || "Warangal",
        sdca: pick("sdca"),
        btsId: pick("btsId"),
        btsName: pick("btsName"),
        ipId: pick("ipId"),
        technology: pick("technology"),
        siteType: pick("siteType"),
        downTime,
        upTime,
        durationMinutes: Math.round(duration),
        alarmCode: pick("alarmCode"),
        vendor: pick("vendor"),
        description,
        additionalInfo: pick("additionalInfo")
      }
    };
  });
}

export function normalizeMasterRows(rows: Record<string, unknown>[], source = "master-upload.xlsx"): BtsMasterRecord[] {
  return rows
    .map((row, index) => {
      const siteId = pickFromRow(row, ["site id", "siteid", "bts ip id", "bts_ip_id", "bts ip", "ip id"]).toUpperCase();
      const slot1 = parsePerson(pickFromRow(row, ["slot 1 pers no name", "slot 1", "slot1", "person 1", "responsible 1"]));
      return {
        id: `master-${siteId || index + 1}`,
        siteId,
        staffNo: slot1.staffNo,
        name: slot1.name,
        active: Boolean(siteId),
        source,
        updatedAt: new Date().toISOString()
      };
    })
    .filter((row) => row.siteId);
}

function coerceDate(value: string) {
  if (!value) return new Date().toISOString();
  if (/^\d+(\.\d+)?$/.test(value)) {
    const excelEpoch = Date.UTC(1899, 11, 30);
    const parsed = new Date(excelEpoch + Number(value) * 86400000);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

export function alarmCategory(code: string, description: string) {
  const text = `${code} ${description}`.toLowerCase();
  if (text.includes("power") || text.includes("eb") || text.includes("battery") || text.includes("dg")) return "Power";
  if (text.includes("ofc") || text.includes("fiber") || text.includes("fibre")) return "OFC";
  if (text.includes("ubr") || text.includes("dmw") || text.includes("trans")) return "Transmission";
  if (text.includes("bts") || text.includes("equip") || text.includes("rru")) return "Equipment";
  return "Other";
}

export function consolidateRecords(records: RawAlarmRecord[], sites: Site[], batchId: string): OutageIncident[] {
  const groups = new Map<string, RawAlarmRecord[]>();
  for (const record of records) {
    const category = alarmCategory(record.normalized.alarmCode, record.normalized.description);
    const key = [
      record.normalized.btsId,
      record.normalized.downTime.slice(0, 16),
      record.normalized.upTime.slice(0, 16),
      category
    ].join("|");
    groups.set(key, [...(groups.get(key) ?? []), record]);
  }

  return Array.from(groups.values()).map((group, index) => {
    const first = group[0];
    const site = sites.find((item) => item.btsId === first.normalized.btsId);
    const category = alarmCategory(first.normalized.alarmCode, first.normalized.description);
    return {
      id: `inc-${batchId}-${index + 1}`,
      batchId,
      siteId: site?.id ?? `unmapped-${first.normalized.btsId}`,
      btsId: first.normalized.btsId,
      outageDate: first.normalized.downTime.slice(0, 10),
      downTime: first.normalized.downTime,
      upTime: first.normalized.upTime,
      durationMinutes: Math.max(...group.map((item) => item.normalized.durationMinutes)),
      alarmCode: first.normalized.alarmCode,
      alarmCategory: category,
      description: first.normalized.description,
      rawRecordIds: group.map((item) => item.id),
      major: group.some((item) => item.normalized.durationMinutes > 60)
    };
  });
}

export function fingerprintRows(rows: Record<string, unknown>[]) {
  return JSON.stringify(rows.map((row) => Object.values(row).join("|"))).length.toString(36) + "-" + rows.length;
}

export function downloadWorkbook(fileName: string, sheets: Record<string, Record<string, unknown>[]>) {
  const workbook = XLSX.utils.book_new();
  Object.entries(sheets).forEach(([name, rows]) => {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), name.slice(0, 31));
  });
  XLSX.writeFile(workbook, fileName);
}

export function buildDetailedOutageRows(state: AppState) {
  return state.outageIncidents.map((incident) => {
    const site = state.sites.find((item) => item.id === incident.siteId);
    const remark = state.outageRemarks.find((item) => item.incidentId === incident.id);
    const proposal = state.improvementProposals.find((item) => item.incidentId === incident.id);
    const sde = state.profiles.find((item) => item.id === site?.sdeId);
    const master = state.btsMaster.find((item) => item.siteId === (site?.btsId ?? incident.btsId));
    return {
      Date: incident.outageDate,
      SSA: site?.ssa,
      SDCA: site?.sdca,
      "BTS IP ID": site?.btsId ?? incident.btsId,
      "BTS Name": site?.btsName,
      Vendor: site?.vendor,
      "Alarm Code": incident.alarmCode,
      Category: incident.alarmCategory,
      "Down Time": incident.downTime,
      "Up Time": incident.upTime,
      "Duration Minutes": incident.durationMinutes,
      "Primary Cause": remark?.primaryCause,
      "Detailed Reason": remark?.detailedReason,
      Responsibility: remark?.responsibility,
      "Restoration Type": remark?.restorationType,
      "Delay Reason": remark?.delayReason,
      "Improvement Required": proposal?.improvementRequired ? "Yes" : proposal ? "No" : "Pending",
      "Improvement Type": proposal?.improvementType,
      "Proposal Status": proposal?.status,
      "Field Officer": sde?.name,
      "Responsible Staff No": master?.staffNo ?? "",
      "Responsible Name": master?.name ?? ""
    };
  });
}

export function buildSiteReportRows(state: AppState, monthIso = new Date().toISOString()) {
  return state.sites.map((site) => {
    const incidents = state.outageIncidents.filter((item) => item.siteId === site.id);
    const availability = availabilityForSite(site, state.outageIncidents, monthIso);
    const latestProposal = state.improvementProposals.find((item) => item.siteId === site.id);
    const master = state.btsMaster.find((item) => item.siteId === site.btsId);
    const causes = incidents.map((item) => item.alarmCategory);
    const mainCause = causes.sort((a, b) => causes.filter((c) => c === b).length - causes.filter((c) => c === a).length)[0] ?? "";
    const downtimeBy = (category: string) => incidents.filter((item) => item.alarmCategory === category).reduce((sum, item) => sum + item.durationMinutes, 0);
    return {
      SSA: site.ssa,
      SDCA: site.sdca,
      "BTS IP ID": site.btsId,
      "BTS Name": site.btsName,
      "Number of Outages": incidents.length,
      "Total Downtime Minutes": availability.downtimeMinutes,
      "Total Downtime HH:MM": `${Math.floor(availability.downtimeMinutes / 60)}:${String(availability.downtimeMinutes % 60).padStart(2, "0")}`,
      "Longest Outage": Math.max(0, ...incidents.map((item) => item.durationMinutes)),
      "First Outage": incidents[0]?.downTime ?? "",
      "Last Outage": incidents[incidents.length - 1]?.downTime ?? "",
      "Monthly Availability": availability.availability.toFixed(2),
      "Gap from 98%": availability.gapFromTarget.toFixed(2),
      "Main Root Cause": mainCause,
      "Power Downtime": downtimeBy("Power"),
      "OFC Downtime": downtimeBy("OFC"),
      "Transmission Downtime": downtimeBy("Transmission"),
      "Equipment Downtime": downtimeBy("Equipment"),
      "Other Downtime": downtimeBy("Other"),
      "Repeat Cause": causes.length > new Set(causes).size ? "Yes" : "No",
      "Improvement Required": latestProposal?.improvementRequired ? "Yes" : "No",
      "Latest Proposal": latestProposal?.technicalProposal ?? "",
      "Proposal Status": latestProposal?.status ?? "",
      "Field Officer": state.profiles.find((item) => item.id === site.sdeId)?.name,
      "Responsible Staff No": master?.staffNo ?? "",
      "Responsible Name": master?.name ?? ""
    };
  });
}

export function buildProposalRows(state: AppState) {
  return state.improvementProposals.map((proposal) => {
    const site = state.sites.find((item) => item.id === proposal.siteId);
    const incident = state.outageIncidents.find((item) => item.id === proposal.incidentId);
    const sde = state.profiles.find((item) => item.id === proposal.sdeId);
    const master = state.btsMaster.find((item) => item.siteId === (site?.btsId ?? incident?.btsId));
    return {
      SSA: site?.ssa ?? "",
      SDCA: site?.sdca ?? "",
      "BTS IP ID": site?.btsId ?? incident?.btsId ?? "",
      "BTS Name": site?.btsName ?? "",
      "Outage Date": incident?.outageDate ?? "",
      "Outage Duration Minutes": incident?.durationMinutes ?? "",
      "Alarm Category": incident?.alarmCategory ?? "",
      "Alarm Description": incident?.description ?? "",
      "Field Officer": sde?.name ?? "",
      "Responsible Staff No": master?.staffNo ?? "",
      "Responsible Name": master?.name ?? "",
      "Improvement Required": proposal.improvementRequired ? "Yes" : "No",
      "No Justification": proposal.noJustification,
      "Improvement Type": proposal.improvementType,
      "Technical Proposal": proposal.technicalProposal,
      "Existing Arrangement": proposal.existingArrangement,
      "Observed Problem": proposal.observedProblem,
      "Affected Sites": proposal.affectedSites,
      "Traffic Affected": proposal.trafficAffected,
      "Expected Benefit": proposal.expectedBenefit,
      "Availability Improvement Expected": proposal.availabilityImprovementExpected,
      "Material Requirement": proposal.materialRequirement,
      "Route Length RKM": proposal.routeLengthRkm,
      "Estimated Cost": proposal.estimatedCost,
      Priority: proposal.priority,
      "Target Completion Date": proposal.targetCompletionDate,
      Status: proposal.status,
      "Proposal Letter Number": proposal.proposalLetterNumber,
      "Proposal Date": proposal.proposalDate,
      "Submitted To Office": proposal.submittedToOffice,
      "Approval Reference": proposal.approvalReference,
      "Work Order Reference": proposal.workOrderReference,
      "Completion Date": proposal.completionDate
    };
  });
}

export function buildMasterRows(state: AppState) {
  return state.btsMaster.map((master) => {
    const site = state.sites.find((item) => item.btsId === master.siteId);
    return {
      "Site ID": master.siteId,
      SDCA: site?.sdca ?? "",
      "BTS Name": site?.btsName ?? "",
      "Responsible Staff No": master.staffNo,
      "Responsible Name": master.name,
      Active: master.active ? "Yes" : "No",
      Source: master.source,
      "Updated At": master.updatedAt
    };
  });
}

export function buildSingleSiteWorkbook(state: AppState, siteId: string): Record<string, Record<string, unknown>[]> {
  const site = state.sites.find((item) => item.id === siteId);
  if (!site) return {};
  const incidents = state.outageIncidents.filter((item) => item.siteId === siteId);
  const summary = buildSiteReportRows({ ...state, sites: [site] });
  return {
    "Site Summary": summary as unknown as Record<string, unknown>[],
    "Outage Details": incidents.map((item) => ({ ...item })) as unknown as Record<string, unknown>[],
    "Detailed Remarks": state.outageRemarks.filter((item) => incidents.some((incident) => incident.id === item.incidentId)) as unknown as Record<string, unknown>[],
    "Proposal History": state.improvementProposals.filter((item) => item.siteId === siteId) as unknown as Record<string, unknown>[]
  };
}
