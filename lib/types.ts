export type Role = "Admin" | "SDE" | "Field Officer" | "Management Viewer";

export type ProposalStatus = "Draft" | "Submitted" | "Approved" | "In Progress" | "Completed" | "Rejected";
export type Priority = "Low" | "Medium" | "High" | "Critical";
export type RestorationType = "Temporary" | "Permanent";

export interface Profile {
  id: string;
  name: string;
  role: Role;
  ssa?: string;
  sdca?: string;
}

export interface SdeSdcaMapping {
  id: string;
  profileId: string;
  sdca: string;
}

export interface Site {
  id: string;
  ssa: string;
  sdca: string;
  btsId: string;
  btsName: string;
  ipId: string;
  technology: string;
  siteType: string;
  vendor: string;
  sdeId: string;
  critical: boolean;
  batteryBackupHours: number;
  transmissionPaths: number;
}

export interface BtsMasterRecord {
  id: string;
  siteId: string;
  staffNo: string;
  name: string;
  active: boolean;
  source: string;
  updatedAt: string;
}

export interface UploadBatch {
  id: string;
  fileName: string;
  uploadedBy: string;
  uploadedAt: string;
  fingerprint: string;
  rowCount: number;
  incidentCount: number;
}

export interface RawAlarmRecord {
  id: string;
  batchId: string;
  sourceRowNumber: number;
  raw: Record<string, string | number | null>;
  normalized: {
    circle?: string;
    ssa: string;
    sdca: string;
    btsId: string;
    btsName: string;
    ipId: string;
    technology: string;
    siteType: string;
    downTime: string;
    upTime: string;
    durationMinutes: number;
    alarmCode: string;
    vendor: string;
    description: string;
    additionalInfo?: string;
  };
}

export interface OutageIncident {
  id: string;
  batchId: string;
  siteId: string;
  btsId: string;
  outageDate: string;
  downTime: string;
  upTime: string;
  durationMinutes: number;
  alarmCode: string;
  alarmCategory: string;
  description: string;
  rawRecordIds: string[];
  major: boolean;
}

export interface OutageRemark {
  id: string;
  incidentId: string;
  sdeId: string;
  primaryCause: string;
  detailedReason: string;
  faultLocation: string;
  actionTaken: string;
  restorationDetails: string;
  restoredBy: string;
  teamOrVendor: string;
  restorationType: RestorationType;
  materialUsed: string;
  delayReason: string;
  responsibility: string;
  preventiveAction: string;
  attachmentPlaceholder: string;
  furtherActionForTemporary: string;
  updatedAt: string;
}

export interface ImprovementProposal {
  id: string;
  incidentId: string;
  siteId: string;
  sdeId: string;
  improvementRequired: boolean;
  noJustification: string;
  improvementType: string;
  technicalProposal: string;
  existingArrangement: string;
  observedProblem: string;
  affectedSites: number;
  trafficAffected: string;
  expectedBenefit: string;
  availabilityImprovementExpected: string;
  materialRequirement: string;
  routeLengthRkm: number;
  estimatedCost: number;
  priority: Priority;
  targetCompletionDate: string;
  status: ProposalStatus;
  proposalLetterNumber: string;
  proposalDate: string;
  submittedToOffice: string;
  approvalReference: string;
  workOrderReference: string;
  completionDate: string;
}

export interface ProposalUpdate {
  id: string;
  proposalId: string;
  status: ProposalStatus;
  note: string;
  updatedBy: string;
  updatedAt: string;
}

export interface EodSubmission {
  id: string;
  sdeId: string;
  sdca: string;
  date: string;
  submittedAt: string;
  late: boolean;
  locked: boolean;
  reopenedAt?: string;
  reopenedBy?: string;
  reopenReason?: string;
}

export interface Attachment {
  id: string;
  incidentId: string;
  fileName: string;
  url: string;
  uploadedAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  details: Record<string, unknown>;
}

export interface AppState {
  profiles: Profile[];
  sdeSdcaMappings: SdeSdcaMapping[];
  sites: Site[];
  btsMaster: BtsMasterRecord[];
  uploadBatches: UploadBatch[];
  rawAlarmRecords: RawAlarmRecord[];
  outageIncidents: OutageIncident[];
  outageRemarks: OutageRemark[];
  improvementProposals: ImprovementProposal[];
  proposalUpdates: ProposalUpdate[];
  eodSubmissions: EodSubmission[];
  attachments: Attachment[];
  auditLogs: AuditLog[];
}

export const PRIMARY_CAUSES = [
  "Commercial power failure",
  "Prolonged EB failure",
  "Battery backup failure",
  "Power plant failure",
  "DG failure",
  "BSNL OFC fault",
  "TIP hired fibre fault",
  "DMW failure",
  "UBR failure",
  "Router or switch failure",
  "BTS equipment fault",
  "BTS hang",
  "VSAT failure",
  "Planned maintenance",
  "Road work",
  "Electrical department work",
  "Forest issue",
  "Theft or vandalism",
  "Natural calamity",
  "Vendor support delay",
  "Access issue",
  "Other"
] as const;

export const IMPROVEMENT_TYPES = [
  "Battery replacement",
  "Additional battery bank",
  "Power plant replacement",
  "DG provision",
  "EB improvement",
  "OFC rehabilitation",
  "OFC route diversion",
  "New OFC route",
  "Hired fibre",
  "DMW replacement",
  "UBR provision",
  "Capacity enhancement",
  "Ring formation",
  "Alternate transmission path",
  "Router replacement",
  "BTS hardware replacement",
  "Earthing improvement",
  "Surge protection",
  "Civil work",
  "Security or fencing",
  "Preventive maintenance",
  "Other"
] as const;
