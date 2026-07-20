import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  AppState,
  Attachment,
  AuditLog,
  BtsMasterRecord,
  EodSubmission,
  ImprovementProposal,
  OutageIncident,
  OutageRemark,
  Profile,
  ProposalUpdate,
  RawAlarmRecord,
  Site,
  UploadBatch
} from "./types";
import { initialState } from "./seed";
import { consolidateRecords, fingerprintRows, normalizeMasterRows, normalizeRows } from "./excel";

const STORAGE_KEY = "bsnl-availability-portal-state-v12";

export interface DataRepository {
  load(): AppState | Promise<AppState>;
  save(state: AppState): void | Promise<void>;
  reset(): AppState | Promise<AppState>;
}

export class LocalJsonRepository implements DataRepository {
  load(): AppState {
    if (typeof window === "undefined") return initialState;
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      this.save(initialState);
      return initialState;
    }
    return JSON.parse(existing) as AppState;
  }

  save(state: AppState) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }

  reset() {
    this.save(initialState);
    return initialState;
  }
}

export class SupabaseRepository implements DataRepository {
  private client: SupabaseClient;

  constructor(url: string, anonKey: string) {
    this.client = createClient(url, anonKey);
  }

  async load(): Promise<AppState> {
    const [
      profiles,
      mappings,
      sites,
      btsMaster,
      uploadBatches,
      rawAlarmRecords,
      outageIncidents,
      outageRemarks,
      improvementProposals,
      proposalUpdates,
      eodSubmissions,
      attachments,
      auditLogs
    ] = await Promise.all([
      this.select("profiles"),
      this.select("field_officer_sdca_mapping"),
      this.select("sites"),
      this.select("bts_master"),
      this.select("upload_batches"),
      this.select("raw_alarm_records"),
      this.select("outage_incidents"),
      this.select("outage_remarks"),
      this.select("improvement_proposals"),
      this.select("proposal_updates"),
      this.select("eod_submissions"),
      this.select("attachments"),
      this.select("audit_logs")
    ]);

    return {
      profiles: profiles.map(fromProfile),
      sdeSdcaMappings: mappings.map((row) => ({ id: row.id, profileId: row.profile_id, sdca: row.sdca })),
      sites: sites.map(fromSite),
      btsMaster: btsMaster.map(fromBtsMaster),
      uploadBatches: uploadBatches.map(fromUploadBatch),
      rawAlarmRecords: rawAlarmRecords.map(fromRawAlarmRecord),
      outageIncidents: outageIncidents.map(fromOutageIncident),
      outageRemarks: outageRemarks.map(fromOutageRemark),
      improvementProposals: improvementProposals.map(fromImprovementProposal),
      proposalUpdates: proposalUpdates.map(fromProposalUpdate),
      eodSubmissions: eodSubmissions.map(fromEodSubmission),
      attachments: attachments.map(fromAttachment),
      auditLogs: auditLogs.map(fromAuditLog)
    };
  }

  async save(state: AppState) {
    await this.upsert("profiles", uniqueRows(state.profiles.map(toProfile), "id"), "id");
    await this.upsert("field_officer_sdca_mapping", uniqueRows(state.sdeSdcaMappings.map((item) => ({ id: item.id, profile_id: item.profileId, sdca: item.sdca })), "id"), "id");
    await this.upsert("sites", uniqueRows(state.sites.map(toSite), "bts_id"), "bts_id");
    await this.upsert("bts_master", uniqueRows(state.btsMaster.map(toBtsMaster), "site_id"), "site_id");
    await this.upsert("upload_batches", uniqueRows(state.uploadBatches.map(toUploadBatch), "fingerprint"), "fingerprint");
    await this.upsert("raw_alarm_records", state.rawAlarmRecords.map(toRawAlarmRecord));
    await this.upsert("outage_incidents", uniqueRows(state.outageIncidents.map(toOutageIncident), "bts_id", "down_time", "up_time", "alarm_category"), "bts_id,down_time,up_time,alarm_category");
    await this.upsert("outage_remarks", uniqueRows(state.outageRemarks.map(toOutageRemark), "incident_id"), "incident_id");
    await this.upsert("improvement_proposals", state.improvementProposals.map(toImprovementProposal));
    await this.upsert("proposal_updates", state.proposalUpdates.map(toProposalUpdate));
    await this.upsert("eod_submissions", uniqueRows(state.eodSubmissions.map(toEodSubmission), "field_officer_id", "date"), "field_officer_id,date");
    await this.upsert("attachments", state.attachments.map(toAttachment));
    await this.upsert("audit_logs", state.auditLogs.map(toAuditLog));
  }

  async reset(): Promise<AppState> {
    return this.load();
  }

  private async select(table: string) {
    const { data, error } = await this.client.from(table).select("*");
    if (error) throw error;
    return data ?? [];
  }

  private async upsert(table: string, rows: Record<string, unknown>[], onConflict?: string) {
    if (!rows.length) return;
    const { error } = await this.client.from(table).upsert(rows, onConflict ? { onConflict } : undefined);
    if (error) throw error;
  }
}

export function getRepository(): DataRepository {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anonKey) return new SupabaseRepository(url, anonKey);
  return new LocalJsonRepository();
}

function newId() {
  return crypto.randomUUID();
}

export function uploadOutageRows(state: AppState, rows: Record<string, unknown>[], fileName: string, actor: Profile) {
  const fingerprint = fingerprintRows(rows);
  const existingBatch = state.uploadBatches.find((batch) => batch.fingerprint === fingerprint);
  const batchId = existingBatch?.id ?? newId();
  const raw = normalizeRows(rows, batchId).map((record) => ({ ...record, id: newId() }));
  const sites = mergeUploadedSites(state, raw);
  const existingIncidentKeys = new Set(state.outageIncidents.map(incidentKey));
  const consolidated = consolidateRecords(raw, sites, batchId).map((incident) => ({ ...incident, id: newId() }));
  const { incidents: refreshedIncidents, updatedCount } = refreshExistingIncidents(state.outageIncidents, consolidated);
  if (existingBatch) {
    const repaired = repairExistingBatchIncidents(refreshedIncidents, consolidated, existingBatch.id);
    return {
      state: {
        ...state,
        sites,
        outageIncidents: repaired.incidents
      },
      duplicate: true,
      incidentCount: repaired.addedCount,
      skippedDuplicateIncidents: consolidated.length - repaired.addedCount,
      updatedIncidentCount: updatedCount + repaired.updatedCount
    };
  }
  const incidents = consolidated.filter((incident) => !existingIncidentKeys.has(incidentKey(incident)));
  const skippedDuplicateIncidents = consolidated.length - incidents.length;
  const next: AppState = {
    ...state,
    sites,
    uploadBatches: [
      ...state.uploadBatches,
      {
        id: batchId,
        fileName,
        uploadedBy: actor.id,
        uploadedAt: new Date().toISOString(),
        fingerprint,
        rowCount: rows.length,
        incidentCount: incidents.length
      }
    ],
    rawAlarmRecords: [...state.rawAlarmRecords, ...raw],
    outageIncidents: [...refreshedIncidents, ...incidents],
    auditLogs: [
      ...state.auditLogs,
      {
        id: newId(),
        actorId: actor.id,
        action: "UPLOAD_OUTAGE_EXCEL",
        entityType: "upload_batches",
        entityId: batchId,
        createdAt: new Date().toISOString(),
        details: { fileName, rawRows: rows.length, incidents: incidents.length, skippedDuplicateIncidents, updatedIncidentCount: updatedCount }
      }
    ]
  };
  return { state: next, duplicate: false, incidentCount: incidents.length, skippedDuplicateIncidents, updatedIncidentCount: updatedCount };
}

function repairExistingBatchIncidents(existingIncidents: OutageIncident[], incomingIncidents: OutageIncident[], batchId: string) {
  const available = [...incomingIncidents];
  let updatedCount = 0;
  const incidents = existingIncidents.map((existing) => {
    if (existing.batchId !== batchId) return existing;
    const matchIndex = available.findIndex((incoming) => looseIncidentKey(incoming) === looseIncidentKey(existing));
    if (matchIndex === -1) return existing;
    const incoming = available.splice(matchIndex, 1)[0];
    updatedCount += 1;
    return {
      ...existing,
      siteId: incoming.siteId,
      btsId: incoming.btsId,
      outageDate: incoming.outageDate,
      downTime: incoming.downTime,
      upTime: incoming.upTime,
      durationMinutes: incoming.durationMinutes,
      alarmCode: incoming.alarmCode,
      alarmCategory: incoming.alarmCategory,
      description: incoming.description,
      rawRecordIds: Array.from(new Set([...existing.rawRecordIds, ...incoming.rawRecordIds])),
      major: incoming.major
    };
  });
  return { incidents: [...incidents, ...available], updatedCount, addedCount: available.length };
}

function refreshExistingIncidents(existingIncidents: OutageIncident[], incomingIncidents: OutageIncident[]) {
  const incomingByKey = new Map(incomingIncidents.map((incident) => [incidentKey(incident), incident]));
  let updatedCount = 0;
  const incidents = existingIncidents.map((existing) => {
    const incoming = incomingByKey.get(incidentKey(existing));
    if (!incoming) return existing;
    updatedCount += 1;
    return {
      ...existing,
      siteId: incoming.siteId,
      btsId: incoming.btsId,
      outageDate: incoming.outageDate,
      downTime: incoming.downTime,
      upTime: incoming.upTime,
      durationMinutes: incoming.durationMinutes,
      alarmCode: incoming.alarmCode,
      alarmCategory: incoming.alarmCategory,
      description: incoming.description,
      rawRecordIds: Array.from(new Set([...existing.rawRecordIds, ...incoming.rawRecordIds])),
      major: incoming.major
    };
  });
  return { incidents, updatedCount };
}

function looseIncidentKey(incident: OutageIncident) {
  return [incident.btsId, incident.durationMinutes, incident.alarmCode, incident.alarmCategory, incident.description].join("|");
}

export function uploadMasterRows(state: AppState, rows: Record<string, unknown>[], fileName: string, actor: Profile) {
  const incoming = normalizeMasterRows(rows, fileName).map((record) => ({ ...record, id: isUuid(record.id) ? record.id : newId() }));
  const bySiteId = new Map(state.btsMaster.map((record) => [record.siteId, record]));
  for (const record of incoming) bySiteId.set(record.siteId, record);

  return {
    state: {
      ...state,
      btsMaster: Array.from(bySiteId.values()).sort((a, b) => a.siteId.localeCompare(b.siteId)),
      auditLogs: [
        ...state.auditLogs,
        {
          id: newId(),
          actorId: actor.id,
          action: "UPLOAD_BTS_MASTER",
          entityType: "bts_master",
          entityId: newId(),
          createdAt: new Date().toISOString(),
          details: { fileName, rows: rows.length, mappedRows: incoming.length }
        }
      ]
    },
    mappedRows: incoming.length
  };
}

function mergeUploadedSites(state: AppState, records: RawAlarmRecord[]): Site[] {
  const sitesByBts = new Map(state.sites.map((site) => [site.btsId, site]));

  for (const record of records) {
    const item = record.normalized;
    if (!item.btsId) continue;

    const sdca = item.sdca || "Unmapped";
    const sde = fieldOfficerForSdca(state, sdca);
    const existing = sitesByBts.get(item.btsId);
    const canPreserveExistingOfficer = sdca.toLowerCase() === "unmapped";

    sitesByBts.set(item.btsId, {
      id: existing?.id ?? newId(),
      ssa: item.ssa || "Warangal",
      sdca,
      btsId: item.btsId,
      btsName: item.btsName || item.ipId || item.btsId,
      ipId: item.ipId || item.btsId,
      technology: item.technology || "Unknown",
      siteType: item.siteType || "Unknown",
      vendor: item.vendor || "Unknown",
      sdeId: sde?.id ?? (canPreserveExistingOfficer ? existing?.sdeId ?? "" : ""),
      critical: existing?.critical ?? false,
      batteryBackupHours: existing?.batteryBackupHours ?? 0,
      transmissionPaths: existing?.transmissionPaths ?? 1
    });
  }

  return Array.from(sitesByBts.values());
}

function fieldOfficerForSdca(state: AppState, sdca: string) {
  const normalized = sdca.trim().toLowerCase();
  const mappedProfileId = state.sdeSdcaMappings.find((mapping) => mapping.sdca.trim().toLowerCase() === normalized)?.profileId;
  if (mappedProfileId) return state.profiles.find((profile) => profile.id === mappedProfileId && profile.role === "SDE");
  return state.profiles.find((profile) => profile.role === "SDE" && profile.sdca?.trim().toLowerCase() === normalized);
}

export function upsertRemark(state: AppState, remark: OutageRemark) {
  return {
    ...state,
    outageRemarks: [...state.outageRemarks.filter((item) => item.incidentId !== remark.incidentId), { ...remark, id: isUuid(remark.id) ? remark.id : newId() }]
  };
}

export function upsertProposal(state: AppState, proposal: ImprovementProposal) {
  return {
    ...state,
    improvementProposals: [
      ...state.improvementProposals.filter((item) => item.incidentId !== proposal.incidentId),
      { ...proposal, id: isUuid(proposal.id) ? proposal.id : newId() }
    ]
  };
}

export function submitEod(state: AppState, submission: EodSubmission) {
  return {
    ...state,
    eodSubmissions: [
      ...state.eodSubmissions.filter((item) => !(item.sdeId === submission.sdeId && item.date === submission.date)),
      { ...submission, id: isUuid(submission.id) ? submission.id : newId() }
    ]
  };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function incidentKey(incident: OutageIncident) {
  return [incident.btsId, incident.downTime, incident.upTime, incident.alarmCategory].join("|");
}

function uniqueRows(rows: Record<string, unknown>[], ...keys: string[]) {
  const map = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    map.set(keys.map((key) => String(row[key] ?? "")).join("|"), row);
  }
  return Array.from(map.values());
}

function fromProfile(row: any): Profile {
  return { id: row.id, name: row.name, role: row.role === "Field Officer" ? "SDE" : row.role, ssa: row.ssa ?? undefined, sdca: row.sdca ?? undefined };
}

function toProfile(item: Profile) {
  return { id: item.id, name: item.name, role: item.role === "SDE" ? "Field Officer" : item.role, ssa: item.ssa ?? null, sdca: item.sdca ?? null };
}

function fromSite(row: any): Site {
  return {
    id: row.id,
    ssa: row.ssa,
    sdca: row.sdca,
    btsId: row.bts_id,
    btsName: row.bts_name,
    ipId: row.ip_id ?? "",
    technology: row.technology ?? "",
    siteType: row.site_type ?? "",
    vendor: row.vendor ?? "",
    sdeId: row.field_officer_id ?? "",
    critical: row.critical,
    batteryBackupHours: Number(row.battery_backup_hours ?? 0),
    transmissionPaths: Number(row.transmission_paths ?? 1)
  };
}

function toSite(item: Site) {
  return {
    id: item.id,
    ssa: item.ssa,
    sdca: item.sdca,
    bts_id: item.btsId,
    bts_name: item.btsName,
    ip_id: item.ipId,
    technology: item.technology,
    site_type: item.siteType,
    vendor: item.vendor,
    field_officer_id: item.sdeId || null,
    critical: item.critical,
    battery_backup_hours: item.batteryBackupHours,
    transmission_paths: item.transmissionPaths
  };
}

function fromBtsMaster(row: any): BtsMasterRecord {
  return {
    id: row.id,
    siteId: row.site_id,
    staffNo: row.field_officer_staff_no ?? "",
    name: row.field_officer_name ?? "",
    active: row.active,
    source: row.source ?? "",
    updatedAt: row.updated_at
  };
}

function toBtsMaster(item: BtsMasterRecord) {
  return {
    id: item.id,
    site_id: item.siteId,
    field_officer_staff_no: item.staffNo,
    field_officer_name: item.name,
    active: item.active,
    source: item.source,
    updated_at: item.updatedAt
  };
}

function fromUploadBatch(row: any): UploadBatch {
  return {
    id: row.id,
    fileName: row.file_name,
    uploadedBy: row.uploaded_by ?? "",
    uploadedAt: row.uploaded_at,
    fingerprint: row.fingerprint,
    rowCount: row.row_count,
    incidentCount: row.incident_count
  };
}

function toUploadBatch(item: UploadBatch) {
  return {
    id: item.id,
    file_name: item.fileName,
    uploaded_by: item.uploadedBy || null,
    uploaded_at: item.uploadedAt,
    fingerprint: item.fingerprint,
    row_count: item.rowCount,
    incident_count: item.incidentCount
  };
}

function fromRawAlarmRecord(row: any): RawAlarmRecord {
  return { id: row.id, batchId: row.batch_id, sourceRowNumber: row.source_row_number, raw: row.raw, normalized: row.normalized };
}

function toRawAlarmRecord(item: RawAlarmRecord) {
  return { id: item.id, batch_id: item.batchId, source_row_number: item.sourceRowNumber, raw: item.raw, normalized: item.normalized };
}

function fromOutageIncident(row: any): OutageIncident {
  return {
    id: row.id,
    batchId: row.batch_id ?? "",
    siteId: row.site_id ?? "",
    btsId: row.bts_id,
    outageDate: row.outage_date,
    downTime: row.down_time,
    upTime: row.up_time,
    durationMinutes: row.duration_minutes,
    alarmCode: row.alarm_code ?? "",
    alarmCategory: row.alarm_category ?? "",
    description: row.description ?? "",
    rawRecordIds: row.raw_record_ids ?? [],
    major: row.major
  };
}

function toOutageIncident(item: OutageIncident) {
  return {
    id: item.id,
    batch_id: item.batchId || null,
    site_id: item.siteId || null,
    bts_id: item.btsId,
    outage_date: item.outageDate,
    down_time: item.downTime,
    up_time: item.upTime,
    duration_minutes: item.durationMinutes,
    alarm_code: item.alarmCode,
    alarm_category: item.alarmCategory,
    description: item.description,
    raw_record_ids: item.rawRecordIds,
    major: item.major
  };
}

function fromOutageRemark(row: any): OutageRemark {
  return {
    id: row.id,
    incidentId: row.incident_id,
    sdeId: row.field_officer_id ?? "",
    primaryCause: row.primary_cause,
    detailedReason: row.detailed_reason ?? "",
    faultLocation: row.fault_location ?? "",
    actionTaken: row.action_taken ?? "",
    restorationDetails: row.restoration_details ?? "",
    restoredBy: row.restored_by ?? "",
    teamOrVendor: row.team_or_vendor ?? "",
    restorationType: row.restoration_type ?? "Temporary",
    materialUsed: row.material_used ?? "",
    delayReason: row.delay_reason ?? "",
    responsibility: row.responsibility ?? "",
    preventiveAction: row.preventive_action ?? "",
    attachmentPlaceholder: row.attachment_placeholder ?? "",
    furtherActionForTemporary: row.further_action_for_temporary ?? "",
    updatedAt: row.updated_at
  };
}

function toOutageRemark(item: OutageRemark) {
  return {
    id: item.id,
    incident_id: item.incidentId,
    field_officer_id: item.sdeId || null,
    primary_cause: item.primaryCause,
    detailed_reason: item.detailedReason,
    fault_location: item.faultLocation,
    action_taken: item.actionTaken,
    restoration_details: item.restorationDetails,
    restored_by: item.restoredBy,
    team_or_vendor: item.teamOrVendor,
    restoration_type: item.restorationType,
    material_used: item.materialUsed,
    delay_reason: item.delayReason,
    responsibility: item.responsibility,
    preventive_action: item.preventiveAction,
    attachment_placeholder: item.attachmentPlaceholder,
    further_action_for_temporary: item.furtherActionForTemporary,
    updated_at: item.updatedAt
  };
}

function fromImprovementProposal(row: any): ImprovementProposal {
  return {
    id: row.id,
    incidentId: row.incident_id ?? "",
    siteId: row.site_id ?? "",
    sdeId: row.field_officer_id ?? "",
    improvementRequired: row.improvement_required,
    noJustification: row.no_justification ?? "",
    improvementType: row.improvement_type ?? "",
    technicalProposal: row.technical_proposal ?? "",
    existingArrangement: row.existing_arrangement ?? "",
    observedProblem: row.observed_problem ?? "",
    affectedSites: Number(row.affected_sites ?? 0),
    trafficAffected: row.traffic_affected ?? "",
    expectedBenefit: row.expected_benefit ?? "",
    availabilityImprovementExpected: row.availability_improvement_expected ?? "",
    materialRequirement: row.material_requirement ?? "",
    routeLengthRkm: Number(row.route_length_rkm ?? 0),
    estimatedCost: Number(row.estimated_cost ?? 0),
    priority: row.priority ?? "Medium",
    targetCompletionDate: row.target_completion_date ?? "",
    status: row.status ?? "Draft",
    proposalLetterNumber: row.proposal_letter_number ?? "",
    proposalDate: row.proposal_date ?? "",
    submittedToOffice: row.submitted_to_office ?? "",
    approvalReference: row.approval_reference ?? "",
    workOrderReference: row.work_order_reference ?? "",
    completionDate: row.completion_date ?? ""
  };
}

function toImprovementProposal(item: ImprovementProposal) {
  return {
    id: item.id,
    incident_id: item.incidentId || null,
    site_id: item.siteId || null,
    field_officer_id: item.sdeId || null,
    improvement_required: item.improvementRequired,
    no_justification: item.noJustification,
    improvement_type: item.improvementType,
    technical_proposal: item.technicalProposal,
    existing_arrangement: item.existingArrangement,
    observed_problem: item.observedProblem,
    affected_sites: item.affectedSites,
    traffic_affected: item.trafficAffected,
    expected_benefit: item.expectedBenefit,
    availability_improvement_expected: item.availabilityImprovementExpected,
    material_requirement: item.materialRequirement,
    route_length_rkm: item.routeLengthRkm,
    estimated_cost: item.estimatedCost,
    priority: item.priority,
    target_completion_date: item.targetCompletionDate || null,
    status: item.status,
    proposal_letter_number: item.proposalLetterNumber,
    proposal_date: item.proposalDate || null,
    submitted_to_office: item.submittedToOffice,
    approval_reference: item.approvalReference,
    work_order_reference: item.workOrderReference,
    completion_date: item.completionDate || null
  };
}

function fromProposalUpdate(row: any): ProposalUpdate {
  return { id: row.id, proposalId: row.proposal_id, status: row.status, note: row.note ?? "", updatedBy: row.updated_by ?? "", updatedAt: row.updated_at };
}

function toProposalUpdate(item: ProposalUpdate) {
  return { id: item.id, proposal_id: item.proposalId, status: item.status, note: item.note, updated_by: item.updatedBy || null, updated_at: item.updatedAt };
}

function fromEodSubmission(row: any): EodSubmission {
  return {
    id: row.id,
    sdeId: row.field_officer_id ?? "",
    sdca: row.sdca,
    date: row.date,
    submittedAt: row.submitted_at,
    late: row.late,
    locked: row.locked,
    reopenedAt: row.reopened_at ?? undefined,
    reopenedBy: row.reopened_by ?? undefined,
    reopenReason: row.reopen_reason ?? undefined
  };
}

function toEodSubmission(item: EodSubmission) {
  return {
    id: item.id,
    field_officer_id: item.sdeId || null,
    sdca: item.sdca,
    date: item.date,
    submitted_at: item.submittedAt,
    late: item.late,
    locked: item.locked,
    reopened_at: item.reopenedAt ?? null,
    reopened_by: item.reopenedBy ?? null,
    reopen_reason: item.reopenReason ?? null
  };
}

function fromAttachment(row: any): Attachment {
  return { id: row.id, incidentId: row.incident_id ?? "", fileName: row.file_name, url: row.url, uploadedAt: row.uploaded_at };
}

function toAttachment(item: Attachment) {
  return { id: item.id, incident_id: item.incidentId || null, file_name: item.fileName, url: item.url, uploaded_at: item.uploadedAt };
}

function fromAuditLog(row: any): AuditLog {
  return { id: row.id, actorId: row.actor_id ?? "", action: row.action, entityType: row.entity_type, entityId: row.entity_id ?? "", createdAt: row.created_at, details: row.details ?? {} };
}

function toAuditLog(item: AuditLog) {
  return { id: item.id, actor_id: item.actorId || null, action: item.action, entity_type: item.entityType, entity_id: item.entityId || null, created_at: item.createdAt, details: item.details };
}
