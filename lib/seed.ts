import { addHours, formatISO, setHours } from "date-fns";
import type { AppState, ImprovementProposal, OutageIncident, OutageRemark, Profile, Site } from "./types";
import { btsMasterSeed } from "./btsMasterSeed";
import { workbookOutageIncidents, workbookSites } from "./tsWorkbookSeed";

const now = new Date();

export const profiles: Profile[] = [
  { id: "admin-1", name: "AGM Admin", role: "Admin" },
  { id: "sde-eturnagaram", name: "Field Officer ETURNAGARAM", role: "SDE", ssa: "Warangal", sdca: "ETURNAGARAM" },
  { id: "sde-mulugu", name: "Field Officer MULUGU", role: "SDE", ssa: "Warangal", sdca: "MULUGU" },
  { id: "sde-narsampet", name: "Field Officer NARSAMPET", role: "SDE", ssa: "Warangal", sdca: "NARSAMPET" },
  { id: "sde-parkal", name: "Field Officer PARKAL", role: "SDE", ssa: "Warangal", sdca: "PARKAL" },
  { id: "mgmt-1", name: "Management Viewer", role: "Management Viewer" }
];

export const sites: Site[] = workbookSites;

export const outageIncidents: OutageIncident[] = workbookOutageIncidents;

const completedIncidentIds = new Set(outageIncidents.filter((_, index) => index % 4 !== 0).map((item) => item.id));

export const outageRemarks: OutageRemark[] = outageIncidents
  .filter((item) => completedIncidentIds.has(item.id))
  .map((item, index) => ({
    id: `remark-${item.id}`,
    incidentId: item.id,
    sdeId: sites.find((site) => site.id === item.siteId)?.sdeId ?? "sde-mulugu",
    primaryCause: item.alarmCategory === "Power" ? "Prolonged EB failure" : item.alarmCategory === "OFC" ? "BSNL OFC fault" : "UBR failure",
    detailedReason: item.major ? "Extended failure required field team coordination and vendor support." : "Fault attended and restored within normal window.",
    faultLocation: "Site premises / feeder section",
    actionTaken: "Field team visited site, isolated fault, and restored service.",
    restorationDetails: "Service normalized and alarms cleared from NMS.",
    restoredBy: "Field team",
    teamOrVendor: index % 3 === 0 ? "Vendor" : "BSNL team",
    restorationType: index % 6 === 0 ? "Temporary" : "Permanent",
    materialUsed: index % 5 === 0 ? "Battery jumper and OFC patch cord" : "No major material",
    delayReason: item.durationMinutes > 60 ? "Remote location access and EB restoration delay" : "",
    responsibility: item.alarmCategory === "Power" ? "Electrical utility" : item.alarmCategory === "OFC" ? "BSNL" : "Vendor",
    preventiveAction: "Monitor repeat alarms and schedule preventive maintenance.",
    attachmentPlaceholder: "photo-placeholder.jpg",
    furtherActionForTemporary: index % 6 === 0 ? "Permanent cable jointing planned within 7 days" : "",
    updatedAt: new Date().toISOString()
  }));

export const improvementProposals: ImprovementProposal[] = outageIncidents
  .filter((item, index) => item.durationMinutes > 240 || index % 7 === 0)
  .map((item, index) => {
    const site = sites.find((candidate) => candidate.id === item.siteId)!;
    return {
      id: `proposal-${item.id}`,
      incidentId: item.id,
      siteId: item.siteId,
      sdeId: site.sdeId,
      improvementRequired: true,
      noJustification: "",
      improvementType: item.alarmCategory === "Power" ? "Additional battery bank" : item.alarmCategory === "OFC" ? "OFC rehabilitation" : "Alternate transmission path",
      technicalProposal: `Improve ${site.btsName} resilience to reduce repeated ${item.alarmCategory.toLowerCase()} outage impact.`,
      existingArrangement: `${site.transmissionPaths} transmission path(s), ${site.batteryBackupHours} hour battery backup.`,
      observedProblem: item.description,
      affectedSites: site.siteType === "Hub" ? 4 : 1,
      trafficAffected: site.critical ? "High" : "Medium",
      expectedBenefit: "Improved monthly availability and faster restoration.",
      availabilityImprovementExpected: "0.8% to 1.5%",
      materialRequirement: item.alarmCategory === "Power" ? "200Ah battery set" : "OFC cable, jointing kit, SFPs",
      routeLengthRkm: item.alarmCategory === "OFC" ? 3.5 : 0,
      estimatedCost: item.alarmCategory === "Power" ? 185000 : 95000,
      priority: site.critical ? "Critical" : index % 2 === 0 ? "High" : "Medium",
      targetCompletionDate: formatISO(addHours(now, 24 * (15 + index))).slice(0, 10),
      status: ["Submitted", "Approved", "In Progress", "Completed"][index % 4] as ImprovementProposal["status"],
      proposalLetterNumber: `WGL/IMPR/${2026}/${100 + index}`,
      proposalDate: now.toISOString().slice(0, 10),
      submittedToOffice: "SSA Planning",
      approvalReference: index % 3 === 0 ? `APR-${200 + index}` : "",
      workOrderReference: index % 4 === 0 ? `WO-${300 + index}` : "",
      completionDate: index % 4 === 3 ? now.toISOString().slice(0, 10) : ""
    };
  });

export const initialState: AppState = {
  profiles,
  sdeSdcaMappings: profiles
    .filter((profile) => profile.role === "SDE" && profile.sdca)
    .map((profile) => ({ id: `map-${profile.id}`, profileId: profile.id, sdca: profile.sdca! })),
  sites,
  btsMaster: btsMasterSeed,
  uploadBatches: [
    {
      id: "seed-batch",
      fileName: "TS.xlsx",
      uploadedBy: "admin-1",
      uploadedAt: new Date().toISOString(),
      fingerprint: "ts-workbook-seed",
      rowCount: 81,
      incidentCount: outageIncidents.length
    }
  ],
  rawAlarmRecords: [],
  outageIncidents,
  outageRemarks,
  improvementProposals,
  proposalUpdates: [],
  eodSubmissions: [
    {
      id: "eod-mulugu",
      sdeId: "sde-mulugu",
      sdca: "MULUGU",
      date: now.toISOString().slice(0, 10),
      submittedAt: setHours(now, 17).toISOString(),
      late: false,
      locked: true
    }
  ],
  attachments: [],
  auditLogs: []
};
