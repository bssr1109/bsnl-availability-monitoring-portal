import * as XLSX from "xlsx";
import { differenceInMinutes, endOfDay, format, isValid, parse, parseISO, startOfMonth } from "date-fns";
import type { AppState, BtsMasterRecord, OutageIncident, RawAlarmRecord, Site } from "./types";
import { availabilityForSite, availabilityPercent, mergeIntervals } from "./availability";

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
  description: ["descrip", "descri", "desc", "description", "alarm description"],
  additionalInfo: ["addl info", "addl in", "addi in", "addi info", "additional info", "additional", "remark", "remarks"],
  faultType: ["fault ty", "fault type", "fault"]
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
    const computedDuration = Math.max(0, (Date.parse(upTime) - Date.parse(downTime)) / 60000);
    const duration = computedDuration || Number(pick("duration")) || 0;
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
  const cleaned = String(value).trim();
  if (/^\d+(\.\d+)?$/.test(cleaned)) {
    const serial = Number(cleaned);
    const parsedCode = XLSX.SSF.parse_date_code(serial);
    if (parsedCode) {
      const parsed = new Date(Date.UTC(parsedCode.y, parsedCode.m - 1, parsedCode.d, parsedCode.H, parsedCode.M, Math.floor(parsedCode.S)));
      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    }
    const excelEpoch = Date.UTC(1899, 11, 30);
    const parsed = new Date(excelEpoch + serial * 86400000);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  const knownFormats = [
    "dd-MM-yyyy HH:mm",
    "dd-MM-yyyy H:mm",
    "dd/MM/yyyy HH:mm",
    "dd/MM/yyyy H:mm",
    "dd-MM-yy HH:mm",
    "dd-MM-yy H:mm",
    "dd/MM/yy HH:mm",
    "dd/MM/yy H:mm",
    "yyyy-MM-dd HH:mm",
    "yyyy/MM/dd HH:mm"
  ];
  for (const formatText of knownFormats) {
    const parsedKnown = parse(cleaned, formatText, new Date());
    if (isValid(parsedKnown)) return parsedKnown.toISOString();
  }
  const parsed = new Date(cleaned);
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
  const canonical = JSON.stringify(rows.map((row) => Object.fromEntries(Object.entries(row).sort(([a], [b]) => a.localeCompare(b)))));
  let hash = 2166136261;
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${rows.length}-${(hash >>> 0).toString(36)}-${canonical.length.toString(36)}`;
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
      "Uploaded Description": incident.description,
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
    const totalDuration = incidents.reduce((sum, item) => sum + item.durationMinutes, 0);
    const downtimeBy = (category: string) => incidents.filter((item) => item.alarmCategory === category).reduce((sum, item) => sum + item.durationMinutes, 0);
    return {
      SSA: site.ssa,
      SDCA: site.sdca,
      "BTS IP ID": site.btsId,
      "BTS Name": site.btsName,
      "Number of Outages": incidents.length,
      "Total Duration Minutes": totalDuration,
      "Total Duration HH:MM": `${Math.floor(totalDuration / 60)}:${String(totalDuration % 60).padStart(2, "0")}`,
      "Availability Downtime Minutes": availability.downtimeMinutes,
      "Availability Downtime HH:MM": `${Math.floor(availability.downtimeMinutes / 60)}:${String(availability.downtimeMinutes % 60).padStart(2, "0")}`,
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

export function buildSiteAvailabilityTillDateWorkbook(state: AppState, asOfIso = new Date().toISOString()) {
  const asOf = parseISO(asOfIso);
  const start = startOfMonth(asOf);
  const end = endOfDay(asOf);
  const totalMinutes = differenceInMinutes(end, start) + 1;
  const startMs = start.getTime();
  const endMs = end.getTime();

  const siteSummaries = state.sites.map((site) => {
    const incidents = monthToDateIncidents(state.outageIncidents, site, startMs, endMs);
    const downtimeMinutes = mergedDowntimeMinutes(incidents, startMs, endMs);
    const availability = availabilityPercent(downtimeMinutes, totalMinutes);
    const master = state.btsMaster.find((item) => item.siteId === site.btsId);
    const fieldOfficer = state.profiles.find((item) => item.id === site.sdeId);
    const dayReasons = incidents.map((incident) => reasonForIncident(state, incident)).filter(Boolean);
    const uniqueReasons = Array.from(new Set(dayReasons));

    return {
      "As On": format(asOf, "yyyy-MM-dd"),
      SSA: site.ssa,
      SDCA: site.sdca,
      "BTS IP ID": site.btsId,
      "BTS Name": site.btsName,
      "Field Officer": fieldOfficer?.name ?? "",
      "Responsible Staff No": master?.staffNo ?? "",
      "Responsible Name": master?.name ?? "",
      "Total Minutes Till Date": totalMinutes,
      "Downtime Minutes Till Date": downtimeMinutes,
      "Availability Till Date": availability.toFixed(2),
      "Less Than 100%": availability < 100 ? "Yes" : "No",
      "Outage Count": incidents.length,
      "Reasons If Below 100%": availability < 100 ? uniqueReasons.join(" | ") : ""
    };
  });

  const below100SiteIds = new Set(siteSummaries.filter((row) => row["Less Than 100%"] === "Yes").map((row) => row["BTS IP ID"]));
  const dayWiseReasons = state.outageIncidents
    .filter((incident) => below100SiteIds.has(incident.btsId))
    .filter((incident) => inWindow(incident.downTime, startMs, endMs))
    .map((incident) => {
      const site = state.sites.find((item) => item.id === incident.siteId);
      const remark = state.outageRemarks.find((item) => item.incidentId === incident.id);
      return {
        Date: incident.outageDate,
        SDCA: site?.sdca ?? "",
        "BTS IP ID": site?.btsId ?? incident.btsId,
        "BTS Name": site?.btsName ?? "",
        Category: incident.alarmCategory,
        "Uploaded Description": incident.description,
        "Down Time": incident.downTime,
        "Up Time": incident.upTime,
        "Duration Minutes": incident.durationMinutes,
        "Primary Cause": remark?.primaryCause ?? "",
        "Detailed Reason": remark?.detailedReason ?? "",
        "Action Taken": remark?.actionTaken ?? "",
        "Delay Reason": remark?.delayReason ?? "",
        "Reason Used": reasonForIncident(state, incident)
      };
    })
    .sort((a, b) => `${a["BTS IP ID"]}-${a.Date}-${a["Down Time"]}`.localeCompare(`${b["BTS IP ID"]}-${b.Date}-${b["Down Time"]}`));

  return {
    "Site Availability": siteSummaries,
    "Day-wise Reasons": dayWiseReasons
  };
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

function monthToDateIncidents(incidents: OutageIncident[], site: Site, startMs: number, endMs: number) {
  return incidents.filter((incident) => incident.siteId === site.id && inWindow(incident.downTime, startMs, endMs));
}

function inWindow(iso: string, startMs: number, endMs: number) {
  const time = Date.parse(iso);
  return time >= startMs && time <= endMs;
}

function mergedDowntimeMinutes(incidents: OutageIncident[], startMs: number, endMs: number) {
  const intervals = incidents.map((incident) => {
    const start = new Date(Math.max(Date.parse(incident.downTime), startMs)).toISOString();
    const end = new Date(Math.min(Date.parse(incident.upTime), endMs)).toISOString();
    return { start, end };
  });
  return mergeIntervals(intervals).reduce((sum, item) => sum + item.minutes, 0);
}

function reasonForIncident(state: AppState, incident: OutageIncident) {
  const remark = state.outageRemarks.find((item) => item.incidentId === incident.id);
  return [
    remark?.primaryCause,
    remark?.detailedReason,
    remark?.actionTaken,
    remark?.delayReason,
    !remark ? incident.alarmCategory : "",
    !remark ? incident.description : ""
  ].filter(Boolean).join(" - ");
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
