"use client";

import { useEffect, useMemo, useState } from "react";
import type React from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Lock,
  RefreshCw,
  Send,
  Shield,
  Upload,
  Unlock,
  UserRound
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { clsx } from "clsx";
import { differenceInMinutes, format, parseISO } from "date-fns";
import type { AppState, ImprovementProposal, OutageIncident, OutageRemark, Profile, Site } from "@/lib/types";
import { IMPROVEMENT_TYPES, PRIMARY_CAUSES } from "@/lib/types";
import { getRepository, submitEod, uploadMasterRows, uploadOutageRows, upsertProposal, upsertRemark } from "@/lib/repository";
import { availabilityForSite, TARGET_AVAILABILITY } from "@/lib/availability";
import {
  buildDetailedOutageRows,
  buildMasterRows,
  buildProposalRows,
  buildSiteAvailabilityTillDateWorkbook,
  buildSiteReportRows,
  buildSingleSiteWorkbook,
  downloadWorkbook,
  readRowsFromWorkbook
} from "@/lib/excel";

const repo = getRepository();
const cutoffHour = 18;
const REMARK_REQUIRED_MINUTES = 10;

type Tab = "dashboard" | "upload" | "master" | "remarks" | "analytics" | "proposals" | "reports";

function canUseTab(user: Profile, tab: Tab) {
  if (tab === "remarks") return user.role === "SDE";
  if (tab === "upload" || tab === "master") return user.role === "Admin";
  if (tab === "proposals") return user.role === "Admin";
  if (tab === "reports") return user.role === "Admin" || user.role === "Management Viewer";
  return true;
}

function roleLabel(profile: Profile) {
  if (profile.role === "Admin") return "AGM/Admin";
  if (profile.role === "SDE") return `Field Officer ${profile.sdca}`;
  return profile.role;
}

function normalizedSdca(value?: string) {
  return (value ?? "").trim().toLowerCase();
}

function allowedSdcasForUser(state: AppState, user: Profile) {
  const allowed = new Set<string>();
  if (user.sdca) allowed.add(normalizedSdca(user.sdca));
  state.sdeSdcaMappings.filter((mapping) => mapping.profileId === user.id).forEach((mapping) => allowed.add(normalizedSdca(mapping.sdca)));
  return allowed;
}

function canViewSite(state: AppState, user: Profile, site: Site) {
  if (user.role !== "SDE") return true;
  const siteSdca = normalizedSdca(site.sdca);
  if (siteSdca && siteSdca !== "unmapped") return allowedSdcasForUser(state, user).has(siteSdca);
  return site.sdeId === user.id;
}

function sortIncidentsDayWise(incidents: OutageIncident[]) {
  return [...incidents].sort((a, b) => {
    const dateCompare = b.outageDate.localeCompare(a.outageDate);
    if (dateCompare !== 0) return dateCompare;
    return Date.parse(b.downTime) - Date.parse(a.downTime);
  });
}

export default function Portal() {
  const [state, setState] = useState<AppState | null>(null);
  const [activeUserId, setActiveUserId] = useState("admin-1");
  const [tab, setTab] = useState<Tab>("dashboard");
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    Promise.resolve(repo.load())
      .then((next) => {
        setState(next);
        setActiveUserId((current) => (next.profiles.some((profile) => profile.id === current) ? current : next.profiles[0]?.id ?? current));
      })
      .catch((error) => {
        console.error(error);
        setToast(`Database load failed: ${error.message ?? "check Supabase settings"}`);
      });
  }, []);

  const activeUser = state?.profiles.find((profile) => profile.id === activeUserId) ?? state?.profiles[0];
  const visibleSites = useMemo(() => {
    if (!state || !activeUser) return [];
    if (activeUser.role === "SDE") return state.sites.filter((site) => canViewSite(state, activeUser, site));
    return state.sites;
  }, [state, activeUser]);

  const visibleIncidents = useMemo(() => {
    if (!state) return [];
    const siteIds = new Set(visibleSites.map((site) => site.id));
    return sortIncidentsDayWise(state.outageIncidents.filter((incident) => siteIds.has(incident.siteId)));
  }, [state, visibleSites]);

  useEffect(() => {
    if (visibleIncidents[0] && (!selectedIncidentId || !visibleIncidents.some((incident) => incident.id === selectedIncidentId))) {
      setSelectedIncidentId(visibleIncidents[0].id);
    }
  }, [selectedIncidentId, visibleIncidents]);

  function persist(next: AppState) {
    setState(next);
    Promise.resolve(repo.save(next)).catch((error) => {
      console.error(error);
      setToast(`Database save failed: ${error.message ?? "check Supabase settings"}`);
    });
  }

  if (!state) {
    return <main className="grid min-h-screen place-items-center text-sm text-slate-600">Loading portal...</main>;
  }

  if (!activeUser) {
    return (
      <main className="grid min-h-screen place-items-center px-4 text-center text-sm text-slate-600">
        <div className="rounded border border-slate-200 bg-white p-6 shadow-soft">
          <h1 className="text-base font-semibold text-ink">No profiles found</h1>
          <p className="mt-2 max-w-md">Supabase connected, but the app cannot read any profile rows. Check that `profiles` has rows and anon read access is enabled.</p>
        </div>
      </main>
    );
  }

  const selectedIncident = state.outageIncidents.find((incident) => incident.id === selectedIncidentId) ?? visibleIncidents[0];
  const selectedSite = selectedIncident ? state.sites.find((site) => site.id === selectedIncident.siteId) : undefined;
  const stats = getStats(state, visibleSites, visibleIncidents);
  const navItems = [
    ["dashboard", "Dashboard", BarChart3],
    ["upload", "Excel Upload", Upload],
    ["master", "BTS Master", FileSpreadsheet],
    ["remarks", "Remarks & Proposal", FileSpreadsheet],
    ["analytics", "Analytics", BarChart3],
    ["proposals", "Proposals", FileSpreadsheet],
    ["reports", "Excel Downloads", Download]
  ].filter(([key]) => canUseTab(activeUser, key as Tab));

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded bg-bsnl text-white">
              <Shield size={22} />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight sm:text-xl">BSNL Availability Monitoring & Improvement Portal</h1>
              <p className="text-xs text-slate-500">Local mock mode - Supabase-ready data layer - Target availability {TARGET_AVAILABILITY}%</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {state.profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => {
                  setActiveUserId(profile.id);
                  setTab(profile.role === "Admin" ? "upload" : "dashboard");
                  setSelectedIncidentId("");
                }}
                className={clsx(
                  "inline-flex items-center gap-2 rounded border px-3 py-2 text-xs font-medium",
                  activeUserId === profile.id ? "border-bsnl bg-bsnl text-white" : "border-slate-200 bg-white text-slate-700"
                )}
              >
                <UserRound size={14} />
                {roleLabel(profile)}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 lg:grid-cols-[230px_1fr]">
        <aside className="rounded border border-slate-200 bg-white p-2 shadow-soft lg:sticky lg:top-24 lg:h-fit">
          {navItems.map(([key, label, Icon]) => (
            <button
              key={key as string}
              onClick={() => setTab(key as Tab)}
              className={clsx(
                "mb-1 flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm",
                tab === key ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              )}
            >
              <Icon size={17} />
              {label as string}
            </button>
          ))}
          <button
            onClick={async () => persist(await repo.reset())}
            className="mt-2 flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-100"
          >
            <RefreshCw size={17} />
            Reset Demo Data
          </button>
        </aside>

        <section className="min-w-0">
          {toast && <div className="mb-4 rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{toast}</div>}
          {tab === "dashboard" && <Dashboard state={state} stats={stats} sites={visibleSites} incidents={visibleIncidents} activeUser={activeUser} persist={persist} />}
          {tab === "upload" && <UploadPanel state={state} activeUser={activeUser} persist={persist} setToast={setToast} />}
          {tab === "master" && <MasterPanel state={state} activeUser={activeUser} persist={persist} setToast={setToast} />}
          {tab === "remarks" && activeUser.role === "SDE" && (
            <RemarksPanel
              state={state}
              incidents={visibleIncidents}
              selectedIncident={selectedIncident}
              selectedSite={selectedSite}
              setSelectedIncidentId={setSelectedIncidentId}
              activeUser={activeUser}
              persist={persist}
              setToast={setToast}
            />
          )}
          {tab === "remarks" && activeUser.role !== "SDE" && <AccessPanel title="Field Officer role required" message="Only Field Officer users can enter or edit outage remarks." />}
          {tab === "analytics" && <Analytics state={state} sites={visibleSites} incidents={visibleIncidents} />}
          {tab === "proposals" && <ProposalAdminPanel state={state} />}
          {tab === "reports" && <Reports state={state} sites={visibleSites} />}
        </section>
      </div>
    </main>
  );
}

function Dashboard({
  state,
  stats,
  sites,
  incidents,
  activeUser,
  persist
}: {
  state: AppState;
  stats: ReturnType<typeof getStats>;
  sites: Site[];
  incidents: OutageIncident[];
  activeUser: Profile;
  persist: (state: AppState) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const eod = state.eodSubmissions.find((item) => item.sdeId === activeUser.id && item.date === today);
  const eodLocked = Boolean(eod?.locked);
  const latestLabel = stats.latestOutageDate ? format(parseISO(stats.latestOutageDate), "dd MMM yyyy") : "latest day";
  const cards = [
    [`Total outages ${latestLabel}`, stats.outagesLatestDay],
    [`Total downtime ${latestLabel}`, `${stats.downtimeLatestDay} min`],
    ["Remarks completed", stats.remarksCompleted],
    ["Remarks pending", stats.remarksPending],
    ["Major outages", stats.majorOutages],
    ["Proposals required", stats.proposalsRequired],
    ["Proposals submitted", stats.proposalsSubmitted],
    ["Sites below 98%", stats.belowTarget],
    ["Projected below 98%", stats.projectedBelowTarget]
  ];

  return (
    <div className="space-y-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded border border-slate-200 bg-white p-4 shadow-soft">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded border border-slate-200 bg-white p-4 shadow-soft">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold">Availability Watchlist</h2>
            <span className="text-xs text-slate-500">{sites.length} mapped sites</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-2">SDCA</th>
                  <th className="p-2">BTS IP ID</th>
                  <th className="p-2">BTS Name</th>
                  <th className="p-2">Downtime</th>
                  <th className="p-2">Current</th>
                  <th className="p-2">Projected</th>
                  <th className="p-2">Margin</th>
                </tr>
              </thead>
              <tbody>
                {sites.slice(0, 12).map((site) => {
                  const a = availabilityForSite(site, state.outageIncidents, new Date().toISOString());
                  return (
                    <tr key={site.id} className="border-t border-slate-100">
                      <td className="p-2">{site.sdca}</td>
                      <td className="p-2 font-mono text-xs font-semibold">{site.btsId}</td>
                      <td className="p-2 font-medium">{site.btsName}</td>
                      <td className="p-2">{a.downtimeMinutes} min</td>
                      <td className={clsx("p-2 font-semibold", a.availability < 98 ? "text-alert" : "text-emerald-700")}>{a.availability.toFixed(2)}%</td>
                      <td className="p-2">{a.projectedAvailability.toFixed(2)}%</td>
                      <td className="p-2">{Math.round(a.remainingMargin)} min</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {activeUser.role === "Admin" ? (
          <AdminReopenPanel state={state} persist={persist} activeUser={activeUser} />
        ) : (
        <div className="rounded border border-slate-200 bg-white p-4 shadow-soft">
          <h2 className="font-semibold">EOD Submission</h2>
          <p className="mt-2 text-sm text-slate-600">
            Status: {eodLocked ? <span className="font-semibold text-emerald-700">Submitted {format(parseISO(eod!.submittedAt), "dd MMM, HH:mm")}</span> : eod ? <span className="font-semibold text-alert">Reopened for correction</span> : "Pending"}
          </p>
          <p className="mt-1 text-sm text-slate-600">Cut-off: {cutoffHour}:00 local time</p>
          <button
            disabled={activeUser.role !== "SDE" || eodLocked}
            onClick={() => {
              const errors = validateEod(state, activeUser, incidents);
              if (errors.length) {
                alert(errors.join("\n"));
                return;
              }
              const submittedAt = new Date();
              persist(
                submitEod(state, {
                  id: `eod-${activeUser.id}-${Date.now()}`,
                  sdeId: activeUser.id,
                  sdca: activeUser.sdca ?? "",
                  date: today,
                  submittedAt: submittedAt.toISOString(),
                  late: submittedAt.getHours() >= cutoffHour,
                  locked: true
                })
              );
            }}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded bg-bsnl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {eodLocked ? <Lock size={17} /> : <Send size={17} />}
            {eodLocked ? "Records Locked" : eod ? "Resubmit EOD" : "Submit EOD"}
          </button>
          {activeUser.role !== "SDE" && <p className="mt-3 text-xs text-slate-500">Switch to a Field Officer login to submit EOD.</p>}
        </div>
        )}
      </section>
    </div>
  );
}

function AdminReopenPanel({ state, persist, activeUser }: { state: AppState; persist: (state: AppState) => void; activeUser: Profile }) {
  const submissions = [...state.eodSubmissions].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  return (
    <div className="rounded border border-slate-200 bg-white p-4 shadow-soft">
      <h2 className="font-semibold">AGM/Admin Remark Reopen</h2>
      <p className="mt-2 text-sm text-slate-600">Unlock a submitted Field Officer day when remarks need correction.</p>
      <div className="mt-4 max-h-[360px] space-y-2 overflow-auto pr-1 scrollbar-thin">
        {submissions.length === 0 && <p className="rounded bg-slate-50 p-3 text-sm text-slate-500">No EOD submissions yet.</p>}
        {submissions.map((submission) => {
          const sde = state.profiles.find((profile) => profile.id === submission.sdeId);
          return (
            <div key={submission.id} className="rounded border border-slate-200 p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{sde?.name ?? submission.sdeId}</p>
                  <p className="text-xs text-slate-500">{submission.sdca} - {submission.date}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {submission.locked ? "Locked" : `Reopened: ${submission.reopenReason ?? "No reason recorded"}`}
                  </p>
                </div>
                <button
                  disabled={!submission.locked}
                  onClick={() => {
                    const reason = window.prompt(`Reason for reopening ${sde?.name ?? submission.sdeId} remarks for ${submission.date}`);
                    if (!reason?.trim()) return;
                    persist({
                      ...state,
                      eodSubmissions: state.eodSubmissions.map((item) =>
                        item.id === submission.id
                          ? {
                              ...item,
                              locked: false,
                              reopenedAt: new Date().toISOString(),
                              reopenedBy: activeUser.id,
                              reopenReason: reason.trim()
                            }
                          : item
                      )
                    });
                  }}
                  className="inline-flex items-center gap-2 rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:bg-slate-300"
                >
                  <Unlock size={14} />
                  Reopen
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UploadPanel({ state, activeUser, persist, setToast }: { state: AppState; activeUser: Profile; persist: (state: AppState) => void; setToast: (message: string) => void }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">AGM/Admin Excel Upload</h2>
          <p className="text-sm text-slate-600">Flexible column matching stores raw alarm rows and creates consolidated outage incidents.</p>
        </div>
        <a href="/sample-outage-upload.xlsx" className="inline-flex items-center gap-2 rounded border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
          <Download size={16} />
          Template
        </a>
      </div>
      <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <Upload className="mb-3 text-bsnl" size={28} />
        <span className="font-medium">Upload outage Excel file</span>
        <span className="mt-1 text-sm text-slate-500">Columns such as circle_id, ssa_name, sdca_name, bts_ip_id, bts_name, bts_down_dt, bts_up_dt, dur, alarm_code, and vendor_name are recognized.</span>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          disabled={activeUser.role !== "Admin"}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const rows = await readRowsFromWorkbook(file);
            const result = uploadOutageRows(state, rows, file.name, activeUser);
            persist(result.state);
            setToast(
              result.duplicate
                ? `Duplicate upload protected: no new incidents were created${result.updatedIncidentCount ? `, refreshed ${result.updatedIncidentCount} existing incidents` : ""}.`
                : `Imported ${rows.length} rows, created ${result.incidentCount} new incidents${result.skippedDuplicateIncidents ? `, refreshed ${result.updatedIncidentCount} and skipped ${result.skippedDuplicateIncidents} already-existing incidents` : ""}.`
            );
          }}
        />
      </label>
      {activeUser.role !== "Admin" && <p className="mt-3 text-sm text-alert">Only AGM/Admin can upload. Use the AGM/Admin login for this screen.</p>}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="p-2">File</th>
              <th className="p-2">Uploaded</th>
              <th className="p-2">Rows</th>
              <th className="p-2">Incidents</th>
            </tr>
          </thead>
          <tbody>
            {state.uploadBatches.map((batch) => (
              <tr key={batch.id} className="border-t border-slate-100">
                <td className="p-2 font-medium">{batch.fileName}</td>
                <td className="p-2">{format(parseISO(batch.uploadedAt), "dd MMM yyyy HH:mm")}</td>
                <td className="p-2">{batch.rowCount}</td>
                <td className="p-2">{batch.incidentCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MasterPanel({ state, activeUser, persist, setToast }: { state: AppState; activeUser: Profile; persist: (state: AppState) => void; setToast: (message: string) => void }) {
  const rows = buildMasterRows(state);
  const mappedCount = rows.filter((row) => row.SDCA).length;

  return (
    <div className="space-y-4">
      <section className="rounded border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">BTS Master Data</h2>
            <p className="text-sm text-slate-600">Site ID is matched with BTS IP ID for responsibility mapping.</p>
          </div>
          <button
            onClick={() => downloadWorkbook("bts-master-data.xlsx", { "BTS Master": rows })}
            className="inline-flex items-center justify-center gap-2 rounded bg-bsnl px-4 py-2 text-sm font-semibold text-white"
          >
            <Download size={17} />
            Download Master
          </button>
        </div>

        <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <Upload className="mb-3 text-bsnl" size={26} />
          <span className="font-medium">Upload BTS master Excel</span>
          <span className="mt-1 text-sm text-slate-500">Expected columns: Site ID and Slot 1 - Pers No & Name.</span>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            disabled={activeUser.role !== "Admin"}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const workbookRows = await readRowsFromWorkbook(file);
              const result = uploadMasterRows(state, workbookRows, file.name, activeUser);
              persist(result.state);
              setToast(`Updated BTS master with ${result.mappedRows} Site ID mappings.`);
            }}
          />
        </label>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Metric label="Master rows" value={state.btsMaster.length} />
          <Metric label="Matched to outage sites" value={mappedCount} />
          <Metric label="Unmatched master rows" value={state.btsMaster.length - mappedCount} />
        </div>
      </section>

      <section className="rounded border border-slate-200 bg-white p-4 shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="p-2">Site ID</th>
                <th className="p-2">SDCA</th>
                <th className="p-2">BTS Name</th>
                <th className="p-2">Responsible Person</th>
                <th className="p-2">Source</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 120).map((row) => (
                <tr key={String(row["Site ID"])} className="border-t border-slate-100">
                  <td className="p-2 font-mono text-xs font-semibold">{row["Site ID"]}</td>
                  <td className="p-2">{row.SDCA || "Unmapped"}</td>
                  <td className="p-2">{row["BTS Name"]}</td>
                  <td className="p-2">{row["Responsible Staff No"]} {row["Responsible Name"]}</td>
                  <td className="p-2">{row.Source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function RemarksPanel(props: {
  state: AppState;
  incidents: OutageIncident[];
  selectedIncident?: OutageIncident;
  selectedSite?: Site;
  setSelectedIncidentId: (id: string) => void;
  activeUser: Profile;
  persist: (state: AppState) => void;
  setToast: (message: string) => void;
}) {
  const { state, incidents, selectedIncident, selectedSite, setSelectedIncidentId, activeUser, persist, setToast } = props;
  const existingRemark = selectedIncident ? state.outageRemarks.find((item) => item.incidentId === selectedIncident.id) : undefined;
  const existingProposal = selectedIncident ? state.improvementProposals.find((item) => item.incidentId === selectedIncident.id) : undefined;
  const selectedMonthIso = selectedIncident?.downTime ?? new Date().toISOString();
  const availability = selectedSite ? availabilityForSite(selectedSite, state.outageIncidents, selectedMonthIso) : undefined;
  const mandatoryProposal = Boolean(selectedIncident && selectedSite && isProposalMandatory(state, selectedIncident, selectedSite));
  const monthIncidents = selectedSite ? incidentsForMonth(state, selectedSite, selectedMonthIso) : [];
  const monthlyDurationTotal = monthIncidents.reduce((sum, item) => sum + actualIncidentMinutes(item), 0);
  const selectedDuration = selectedIncident ? actualIncidentMinutes(selectedIncident) : 0;
  const [remark, setRemark] = useState<Partial<OutageRemark>>(existingRemark ?? {});
  const [proposal, setProposal] = useState<Partial<ImprovementProposal>>(existingProposal ?? { improvementRequired: mandatoryProposal });
  let lastTaskDate = "";

  useEffect(() => {
    setRemark(existingRemark ?? {});
    setProposal(existingProposal ?? { improvementRequired: mandatoryProposal });
  }, [existingRemark, existingProposal, selectedIncident?.id, mandatoryProposal]);

  if (activeUser.role !== "SDE") {
    return <AccessPanel title="Field Officer role required" message="Only Field Officer users can enter or edit outage remarks." />;
  }

  if (!selectedIncident || !selectedSite) {
    return <div className="rounded border border-slate-200 bg-white p-5">No incident selected.</div>;
  }

  const locked = state.eodSubmissions.some((item) => item.sdeId === selectedSite.sdeId && item.date === new Date().toISOString().slice(0, 10) && item.locked);
  const remarkRequired = needsRemark(selectedIncident);
  const save = () => {
    if (locked) return;
    if (!remarkRequired) return;
    if (!remark.primaryCause) {
      alert("Select primary cause before saving remarks.");
      return;
    }
    if (actualIncidentMinutes(selectedIncident) > 60 && !remark.delayReason) {
      alert("Delay reason is mandatory when outage duration exceeds one hour.");
      return;
    }
    const fullRemark: OutageRemark = {
      id: existingRemark?.id ?? `remark-${selectedIncident.id}`,
      incidentId: selectedIncident.id,
      sdeId: selectedSite.sdeId,
      primaryCause: remark.primaryCause,
      detailedReason: remark.detailedReason ?? "",
      faultLocation: remark.faultLocation ?? "",
      actionTaken: remark.actionTaken ?? "",
      restorationDetails: remark.restorationDetails ?? "",
      restoredBy: remark.restoredBy ?? "",
      teamOrVendor: remark.teamOrVendor ?? "",
      restorationType: remark.restorationType ?? "Permanent",
      materialUsed: remark.materialUsed ?? "",
      delayReason: remark.delayReason ?? "",
      responsibility: remark.responsibility ?? "",
      preventiveAction: remark.preventiveAction ?? "",
      attachmentPlaceholder: remark.attachmentPlaceholder ?? "",
      furtherActionForTemporary: remark.furtherActionForTemporary ?? "",
      updatedAt: new Date().toISOString()
    };
    let next = upsertRemark(state, fullRemark);
    if (proposal.improvementRequired !== undefined) {
      const fullProposal: ImprovementProposal = {
        id: existingProposal?.id ?? `proposal-${selectedIncident.id}`,
        incidentId: selectedIncident.id,
        siteId: selectedSite.id,
        sdeId: selectedSite.sdeId,
        improvementRequired: Boolean(proposal.improvementRequired),
        noJustification: proposal.noJustification ?? "",
        improvementType: proposal.improvementType ?? IMPROVEMENT_TYPES[0],
        technicalProposal: proposal.technicalProposal ?? "",
        existingArrangement: proposal.existingArrangement ?? "",
        observedProblem: proposal.observedProblem ?? "",
        affectedSites: Number(proposal.affectedSites ?? 1),
        trafficAffected: proposal.trafficAffected ?? "",
        expectedBenefit: proposal.expectedBenefit ?? "",
        availabilityImprovementExpected: proposal.availabilityImprovementExpected ?? "",
        materialRequirement: proposal.materialRequirement ?? "",
        routeLengthRkm: Number(proposal.routeLengthRkm ?? 0),
        estimatedCost: Number(proposal.estimatedCost ?? 0),
        priority: proposal.priority ?? "Medium",
        targetCompletionDate: proposal.targetCompletionDate ?? new Date().toISOString().slice(0, 10),
        status: proposal.status ?? "Draft",
        proposalLetterNumber: proposal.proposalLetterNumber ?? "",
        proposalDate: proposal.proposalDate ?? "",
        submittedToOffice: proposal.submittedToOffice ?? "",
        approvalReference: proposal.approvalReference ?? "",
        workOrderReference: proposal.workOrderReference ?? "",
        completionDate: proposal.completionDate ?? ""
      };
      next = upsertProposal(next, fullProposal);
    }
    persist(next);
    setToast("Remarks and proposal assessment saved.");
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[310px_1fr]">
      <div className="rounded border border-slate-200 bg-white p-3 shadow-soft">
        <h2 className="mb-3 font-semibold">Outage Tasks</h2>
        <div className="max-h-[70vh] space-y-2 overflow-auto pr-1 scrollbar-thin">
          {incidents.map((incident) => {
            const site = state.sites.find((item) => item.id === incident.siteId);
            const done = state.outageRemarks.some((item) => item.incidentId === incident.id);
            const required = needsRemark(incident);
            const showDateHeader = incident.outageDate !== lastTaskDate;
            lastTaskDate = incident.outageDate;
            return (
              <div key={incident.id} className="space-y-2">
                {showDateHeader && <div className="sticky top-0 z-10 rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{format(parseISO(incident.downTime), "dd MMM yyyy")}</div>}
                <button
                  onClick={() => setSelectedIncidentId(incident.id)}
                  className={clsx("w-full rounded border p-3 text-left text-sm", incident.id === selectedIncident.id ? "border-bsnl bg-blue-50" : "border-slate-200 bg-white")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{site ? `${site.btsId} - ${site.btsName}` : incident.btsId}</span>
                    {!required ? <span className="rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">No remarks</span> : done ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertTriangle size={16} className="text-alert" />}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{incident.alarmCategory} - {actualIncidentMinutes(incident)} min - {site?.sdca}</p>
                  {incident.description && <p className="mt-1 truncate text-xs text-slate-500">{incident.description}</p>}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <section className="rounded border border-slate-200 bg-white p-4 shadow-soft">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">{selectedSite.btsId} - {selectedSite.btsName}</h2>
              <p className="text-sm text-slate-600">SSA {selectedSite.ssa} - SDCA {selectedSite.sdca} - IP {selectedSite.ipId}</p>
            </div>
            <span className={clsx("rounded px-2 py-1 text-xs font-semibold", selectedIncident.major ? "bg-orange-100 text-alert" : "bg-emerald-100 text-emerald-700")}>
              {selectedIncident.major ? "Major outage" : "Normal outage"}
            </span>
          </div>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <Info label="Alarm" value={selectedIncident.alarmCode || "-"} />
            <Info label="Uploaded description" value={selectedIncident.description || "No description in upload"} />
            <Info label="Down / Up" value={formatDownUp(selectedIncident)} />
            <Info label="Duration" value={`${selectedDuration} minutes`} />
            <Info label="Availability" value={`${availability?.availability.toFixed(2)}% current - ${availability?.projectedAvailability.toFixed(2)}% projected`} />
            <Info label="Monthly count" value={monthIncidents.length} />
            <Info label="Total duration" value={`${monthlyDurationTotal} minutes`} />
            <Info label="Availability downtime" value={`${availability?.downtimeMinutes} minutes`} />
            <Info label="Site type/vendor" value={`${selectedSite.siteType} - ${selectedSite.vendor}`} />
            <Info label="98% margin" value={`${Math.round(availability?.remainingMargin ?? 0)} minutes remaining`} />
          </div>
        </section>

        {!remarkRequired ? (
          <section className="rounded border border-slate-200 bg-white p-4 shadow-soft">
            <h3 className="font-semibold">No Remarks Required</h3>
            <p className="mt-2 text-sm text-slate-600">
              This outage duration is {selectedDuration} minutes. Remarks are required only when downtime is greater than {REMARK_REQUIRED_MINUTES} minutes.
            </p>
          </section>
        ) : (
        <>
        <section className="rounded border border-slate-200 bg-white p-4 shadow-soft">
          <h3 className="font-semibold">Outage Remarks</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Select label="Primary cause" value={remark.primaryCause} options={[...PRIMARY_CAUSES].sort((a, b) => a.localeCompare(b))} onChange={(value) => setRemark({ ...remark, primaryCause: value })} placeholder="Select reason" />
            <Field label="Exact fault location" value={remark.faultLocation} onChange={(value) => setRemark({ ...remark, faultLocation: value })} />
            <Area label="Detailed reason" value={remark.detailedReason} onChange={(value) => setRemark({ ...remark, detailedReason: value })} required={selectedIncident.major} />
            <Area label="Action taken" value={remark.actionTaken} onChange={(value) => setRemark({ ...remark, actionTaken: value })} />
            <Field label="Restoration details" value={remark.restorationDetails} onChange={(value) => setRemark({ ...remark, restorationDetails: value })} />
            <Field label="Restored by" value={remark.restoredBy} onChange={(value) => setRemark({ ...remark, restoredBy: value })} />
            <Field label="Team or vendor" value={remark.teamOrVendor} onChange={(value) => setRemark({ ...remark, teamOrVendor: value })} />
            <Select label="Temporary or permanent restoration" value={remark.restorationType} options={["Permanent", "Temporary"]} onChange={(value) => setRemark({ ...remark, restorationType: value as OutageRemark["restorationType"] })} />
            <Field label="Material or spare used" value={remark.materialUsed} onChange={(value) => setRemark({ ...remark, materialUsed: value })} />
            <Field label="Delay reason" value={remark.delayReason} onChange={(value) => setRemark({ ...remark, delayReason: value })} required={selectedDuration > 60} />
            <Field label="Responsibility" value={remark.responsibility} onChange={(value) => setRemark({ ...remark, responsibility: value })} />
            <Field label="Preventive action" value={remark.preventiveAction} onChange={(value) => setRemark({ ...remark, preventiveAction: value })} />
            <Field label="Supporting document or photo placeholder" value={remark.attachmentPlaceholder} onChange={(value) => setRemark({ ...remark, attachmentPlaceholder: value })} />
            {remark.restorationType === "Temporary" && <Field label="Further action for temporary restoration" value={remark.furtherActionForTemporary} onChange={(value) => setRemark({ ...remark, furtherActionForTemporary: value })} required />}
          </div>
        </section>

        <section className="rounded border border-slate-200 bg-white p-4 shadow-soft">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-semibold">Improvement Proposal Assessment</h3>
            {mandatoryProposal && <span className="rounded bg-orange-100 px-2 py-1 text-xs font-semibold text-alert">Mandatory by rule</span>}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Select label="Improvement required" value={proposal.improvementRequired ? "Yes" : "No"} options={["Yes", "No"]} onChange={(value) => setProposal({ ...proposal, improvementRequired: value === "Yes" })} />
            {!proposal.improvementRequired && <Field label="Justification when No is selected" value={proposal.noJustification} onChange={(value) => setProposal({ ...proposal, noJustification: value })} required={mandatoryProposal} />}
            <Select label="Improvement type" value={proposal.improvementType} options={[...IMPROVEMENT_TYPES]} onChange={(value) => setProposal({ ...proposal, improvementType: value })} />
            <Field label="Existing arrangement" value={proposal.existingArrangement} onChange={(value) => setProposal({ ...proposal, existingArrangement: value })} />
            <Area label="Detailed technical proposal" value={proposal.technicalProposal} onChange={(value) => setProposal({ ...proposal, technicalProposal: value })} />
            <Area label="Observed problem" value={proposal.observedProblem} onChange={(value) => setProposal({ ...proposal, observedProblem: value })} />
            <Field label="Number of affected sites" type="number" value={proposal.affectedSites} onChange={(value) => setProposal({ ...proposal, affectedSites: Number(value) })} />
            <Field label="Traffic affected" value={proposal.trafficAffected} onChange={(value) => setProposal({ ...proposal, trafficAffected: value })} />
            <Field label="Expected benefit" value={proposal.expectedBenefit} onChange={(value) => setProposal({ ...proposal, expectedBenefit: value })} />
            <Field label="Availability improvement expected" value={proposal.availabilityImprovementExpected} onChange={(value) => setProposal({ ...proposal, availabilityImprovementExpected: value })} />
            <Field label="Equipment or material requirement" value={proposal.materialRequirement} onChange={(value) => setProposal({ ...proposal, materialRequirement: value })} />
            <Field label="Route length or RKM" type="number" value={proposal.routeLengthRkm} onChange={(value) => setProposal({ ...proposal, routeLengthRkm: Number(value) })} />
            <Field label="Estimated cost" type="number" value={proposal.estimatedCost} onChange={(value) => setProposal({ ...proposal, estimatedCost: Number(value) })} />
            <Select label="Priority" value={proposal.priority} options={["Low", "Medium", "High", "Critical"]} onChange={(value) => setProposal({ ...proposal, priority: value as ImprovementProposal["priority"] })} />
            <Field label="Target completion date" type="date" value={proposal.targetCompletionDate} onChange={(value) => setProposal({ ...proposal, targetCompletionDate: value })} />
            <Select label="Proposal status" value={proposal.status} options={["Draft", "Submitted", "Approved", "In Progress", "Completed", "Rejected"]} onChange={(value) => setProposal({ ...proposal, status: value as ImprovementProposal["status"] })} />
            <Field label="Proposal letter number" value={proposal.proposalLetterNumber} onChange={(value) => setProposal({ ...proposal, proposalLetterNumber: value })} />
            <Field label="Proposal date" type="date" value={proposal.proposalDate} onChange={(value) => setProposal({ ...proposal, proposalDate: value })} />
            <Field label="Submitted-to office" value={proposal.submittedToOffice} onChange={(value) => setProposal({ ...proposal, submittedToOffice: value })} />
            <Field label="Approval reference" value={proposal.approvalReference} onChange={(value) => setProposal({ ...proposal, approvalReference: value })} />
            <Field label="Work order reference" value={proposal.workOrderReference} onChange={(value) => setProposal({ ...proposal, workOrderReference: value })} />
            <Field label="Completion date" type="date" value={proposal.completionDate} onChange={(value) => setProposal({ ...proposal, completionDate: value })} />
          </div>
          <button disabled={locked} onClick={save} className="mt-5 inline-flex items-center gap-2 rounded bg-bsnl px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300">
            <CheckCircle2 size={17} />
            {locked ? "Locked after EOD" : "Save Remarks"}
          </button>
        </section>
        </>
        )}
      </div>
    </div>
  );
}

function Analytics({ state, sites, incidents }: { state: AppState; sites: Site[]; incidents: OutageIncident[] }) {
  const bySdca = Object.values(
    sites.reduce<Record<string, { sdca: string; downtime: number; sites: number }>>((acc, site) => {
      acc[site.sdca] ??= { sdca: site.sdca, downtime: 0, sites: 0 };
      acc[site.sdca].sites += 1;
      acc[site.sdca].downtime += incidents.filter((item) => item.siteId === site.id).reduce((sum, item) => sum + item.durationMinutes, 0);
      return acc;
    }, {})
  );
  const byCause = Object.values(
    incidents.reduce<Record<string, { name: string; value: number }>>((acc, item) => {
      acc[item.alarmCategory] ??= { name: item.alarmCategory, value: 0 };
      acc[item.alarmCategory].value += item.durationMinutes;
      return acc;
    }, {})
  );
  const topSites = sites
    .map((site) => ({ site: `${site.btsId} ${site.btsName}`, downtime: incidents.filter((item) => item.siteId === site.id).reduce((sum, item) => sum + item.durationMinutes, 0) }))
    .sort((a, b) => b.downtime - a.downtime)
    .slice(0, 20);
  const trend = Array.from(
    incidents.reduce<Map<string, number>>((acc, item) => {
      acc.set(item.outageDate, (acc.get(item.outageDate) ?? 0) + item.durationMinutes);
      return acc;
    }, new Map())
  ).map(([date, downtime]) => ({ date: date.slice(5), availability: Math.max(90, 100 - downtime / 200) }));
  const repeatSites = sites.filter((site) => incidents.filter((item) => item.siteId === site.id).length >= 3).length;
  const mttr = Math.round(incidents.reduce((sum, item) => sum + item.durationMinutes, 0) / Math.max(1, incidents.length));
  const late = state.eodSubmissions.filter((item) => item.late).length;
  const pendingRemarks = incidents.filter((incident) => needsRemark(incident) && !state.outageRemarks.some((remark) => remark.incidentId === incident.id)).length;
  const tempPending = state.outageRemarks.filter((remark) => remark.restorationType === "Temporary" && !remark.furtherActionForTemporary).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Sites below 98%" value={sites.filter((site) => availabilityForSite(site, state.outageIncidents, new Date().toISOString()).availability < 98).length} />
        <Metric label="Repeat outage sites" value={repeatSites} />
        <Metric label="Mean time to restore" value={`${mttr} min`} />
        <Metric label="Pending remarks" value={pendingRemarks} />
        <Metric label="Late submissions" value={late} />
        <Metric label="Temporary pending action" value={tempPending} />
        <Metric label="Critical proposals" value={state.improvementProposals.filter((item) => item.priority === "Critical").length} />
        <Metric label="Proposal statuses" value={new Set(state.improvementProposals.map((item) => item.status)).size} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartBox title="SDCA-wise downtime">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={bySdca}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sdca" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="downtime" fill="#0967a8" />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
        <ChartBox title="Root-cause-wise downtime">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={byCause} dataKey="value" nameKey="name" outerRadius={90} label>
                {byCause.map((_, index) => <Cell key={index} fill={["#0967a8", "#c2410c", "#16a34a", "#7c3aed", "#475569"][index % 5]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartBox>
        <ChartBox title="Top 20 sites by downtime">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topSites} layout="vertical" margin={{ left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="site" type="category" width={90} />
              <Tooltip />
              <Bar dataKey="downtime" fill="#172033" />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
        <ChartBox title="Daily availability trend">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[90, 100]} />
              <Tooltip />
              <Line dataKey="availability" stroke="#16a34a" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>
      <div className="rounded border border-slate-200 bg-white p-4 shadow-soft">
        <h2 className="mb-3 font-semibold">Filters Available</h2>
        <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {["Date range", "SSA", "SDCA", "BTS", "Vendor", "Cause", "Responsibility", "Field Officer", "Proposal status"].map((filter) => (
            <select key={filter} className="rounded border border-slate-200 px-3 py-2">
              <option>{filter}</option>
            </select>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProposalAdminPanel({ state }: { state: AppState }) {
  const rows = buildProposalRows(state);
  const statusCounts = state.improvementProposals.reduce<Record<string, number>>((acc, proposal) => {
    acc[proposal.status] = (acc[proposal.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total proposals" value={state.improvementProposals.length} />
        <Metric label="Critical proposals" value={state.improvementProposals.filter((item) => item.priority === "Critical").length} />
        <Metric label="Submitted" value={statusCounts.Submitted ?? 0} />
        <Metric label="In progress" value={statusCounts["In Progress"] ?? 0} />
      </div>

      <section className="rounded border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Improvement Proposals</h2>
            <p className="text-sm text-slate-600">AGM/Admin view of all Field Officer-submitted proposal assessments.</p>
          </div>
          <button
            onClick={() => downloadWorkbook("improvement-proposals.xlsx", { "Improvement Proposals": rows })}
            className="inline-flex items-center justify-center gap-2 rounded bg-bsnl px-4 py-2 text-sm font-semibold text-white"
          >
            <Download size={17} />
            Download Excel
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="p-2">SDCA</th>
                <th className="p-2">BTS IP ID</th>
                <th className="p-2">BTS Name</th>
                <th className="p-2">Field Officer</th>
                <th className="p-2">Type</th>
                <th className="p-2">Priority</th>
                <th className="p-2">Status</th>
                <th className="p-2">Target</th>
                <th className="p-2">Proposal</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row["BTS IP ID"]}-${index}`} className="border-t border-slate-100 align-top">
                  <td className="p-2">{row.SDCA}</td>
                  <td className="p-2 font-mono text-xs font-semibold">{row["BTS IP ID"]}</td>
                  <td className="p-2 font-medium">{row["BTS Name"]}</td>
                  <td className="p-2">{row["Field Officer"]}</td>
                  <td className="p-2">{row["Improvement Type"]}</td>
                  <td className="p-2">{row.Priority}</td>
                  <td className="p-2">{row.Status}</td>
                  <td className="p-2">{row["Target Completion Date"]}</td>
                  <td className="max-w-[340px] p-2">{row["Technical Proposal"]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Reports({ state, sites }: { state: AppState; sites: Site[] }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-5 shadow-soft">
      <h2 className="text-lg font-semibold">Excel Downloads</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <ExportButton label="Detailed Outage Remarks" onClick={() => downloadWorkbook("detailed-outage-remarks.xlsx", { "Detailed Outage Remarks": buildDetailedOutageRows(state) })} />
        <ExportButton label="Site-wise Consolidated Report" onClick={() => downloadWorkbook("site-wise-consolidated-report.xlsx", { "Site Report": buildSiteReportRows(state) })} />
        <ExportButton label="Availability Till Date Reasons" onClick={() => downloadWorkbook("availability-till-date-reasons.xlsx", buildSiteAvailabilityTillDateWorkbook(state))} />
        <ExportButton label="Pending Remarks" onClick={() => downloadWorkbook("pending-remarks.xlsx", { Pending: buildDetailedOutageRows(state).filter((row) => Number(row["Duration Minutes"]) > REMARK_REQUIRED_MINUTES && !row["Primary Cause"]) })} />
        <ExportButton label="Improvement Proposals" onClick={() => downloadWorkbook("improvement-proposals.xlsx", { "Improvement Proposals": buildProposalRows(state) })} />
        <ExportButton label="EOD Compliance" onClick={() => downloadWorkbook("eod-compliance.xlsx", { EOD: state.eodSubmissions as unknown as Record<string, unknown>[] })} />
        <ExportButton label="Temporary Restorations" onClick={() => downloadWorkbook("temporary-restorations.xlsx", { Temporary: state.outageRemarks.filter((item) => item.restorationType === "Temporary") as unknown as Record<string, unknown>[] })} />
        <ExportButton label="Sites Below 98%" onClick={() => downloadWorkbook("sites-below-98.xlsx", { Sites: buildSiteReportRows(state).filter((row) => Number(row["Monthly Availability"]) < 98) })} />
        <ExportButton label="BTS Master Data" onClick={() => downloadWorkbook("bts-master-data.xlsx", { "BTS Master": buildMasterRows(state) })} />
      </div>
      <div className="mt-6">
        <label className="text-sm font-medium text-slate-700">Single-site workbook</label>
        <select
          className="mt-2 w-full rounded border border-slate-200 px-3 py-2 text-sm"
          onChange={(event) => event.target.value && downloadWorkbook(`${event.target.value}-single-site.xlsx`, buildSingleSiteWorkbook(state, event.target.value))}
          defaultValue=""
        >
          <option value="">Select site to download Site Summary, Outage Details, Detailed Remarks, Proposal History</option>
          {sites.map((site) => (
            <option key={site.id} value={site.id}>{site.sdca} - {site.btsId} - {site.btsName}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function incidentsForMonth(state: AppState, site: Site, monthIso: string) {
  const monthKey = format(parseISO(monthIso), "yyyy-MM");
  return state.outageIncidents.filter((item) => {
    if (item.siteId !== site.id) return false;
    try {
      return format(parseISO(item.downTime), "yyyy-MM") === monthKey;
    } catch {
      return item.downTime.startsWith(monthKey);
    }
  });
}

function actualIncidentMinutes(incident: OutageIncident) {
  const down = parseISO(incident.downTime);
  const up = parseISO(incident.upTime);
  const computed = differenceInMinutes(up, down);
  return computed > 0 ? computed : incident.durationMinutes;
}

function formatDownUp(incident: OutageIncident) {
  const down = parseISO(incident.downTime);
  const up = parseISO(incident.upTime);
  return `${format(down, "dd MMM yyyy HH:mm")} - ${format(up, "dd MMM yyyy HH:mm")}`;
}

function getStats(state: AppState, sites: Site[], incidents: OutageIncident[]) {
  const latestOutageDate = incidents.reduce((latest, incident) => (incident.outageDate > latest ? incident.outageDate : latest), "");
  const siteIds = new Set(sites.map((site) => site.id));
  const latestDayIncidents = latestOutageDate ? incidents.filter((item) => item.outageDate === latestOutageDate) : [];
  const remarkRequiredIncidents = latestDayIncidents.filter(needsRemark);
  const remarksCompleted = remarkRequiredIncidents.filter((incident) => state.outageRemarks.some((remark) => remark.incidentId === incident.id)).length;
  const proposalNeeded = latestDayIncidents.filter((incident) => {
    const site = state.sites.find((item) => item.id === incident.siteId);
    return site ? isProposalMandatory(state, incident, site) : false;
  }).length;
  return {
    latestOutageDate,
    outagesLatestDay: latestDayIncidents.length,
    downtimeLatestDay: latestDayIncidents.reduce((sum, item) => sum + item.durationMinutes, 0),
    remarksCompleted,
    remarksPending: remarkRequiredIncidents.length - remarksCompleted,
    majorOutages: latestDayIncidents.filter((item) => item.major).length,
    proposalsRequired: proposalNeeded,
    proposalsSubmitted: state.improvementProposals.filter((item) => siteIds.has(item.siteId) && latestDayIncidents.some((incident) => incident.id === item.incidentId)).length,
    belowTarget: sites.filter((site) => availabilityForSite(site, state.outageIncidents, new Date().toISOString()).availability < 98).length,
    projectedBelowTarget: sites.filter((site) => availabilityForSite(site, state.outageIncidents, new Date().toISOString()).projectedAvailability < 98).length
  };
}

function isProposalMandatory(state: AppState, incident: OutageIncident, site: Site) {
  if (!needsRemark(incident)) return false;
  const siteIncidents = state.outageIncidents.filter((item) => item.siteId === site.id);
  const availability = availabilityForSite(site, state.outageIncidents, new Date().toISOString());
  const sameCauseRepeats = siteIncidents.filter((item) => item.alarmCategory === incident.alarmCategory).length >= 2;
  const batteryIssue = site.batteryBackupHours < 2.5 && incident.alarmCategory === "Power";
  return availability.availability < 98 || siteIncidents.length >= 3 || actualIncidentMinutes(incident) > 240 || batteryIssue || site.transmissionPaths === 1 || sameCauseRepeats || site.critical;
}

function needsRemark(incident: OutageIncident) {
  return actualIncidentMinutes(incident) > REMARK_REQUIRED_MINUTES;
}

function validateEod(state: AppState, activeUser: Profile, incidents: OutageIncident[]) {
  const errors: string[] = [];
  for (const incident of incidents) {
    if (!needsRemark(incident)) continue;
    const remark = state.outageRemarks.find((item) => item.incidentId === incident.id);
    const proposal = state.improvementProposals.find((item) => item.incidentId === incident.id);
    if (!remark) errors.push(`Remarks pending for ${incident.btsId}`);
    if (remark && !remark.primaryCause) errors.push(`Primary cause missing for ${incident.btsId}`);
    if (incident.major && !remark?.detailedReason) errors.push(`Detailed reason missing for major outage ${incident.btsId}`);
    if (actualIncidentMinutes(incident) > 60 && !remark?.delayReason) errors.push(`Delay reason missing for ${incident.btsId}`);
    if (remark?.restorationType === "Temporary" && !remark.furtherActionForTemporary) errors.push(`Temporary restoration further action missing for ${incident.btsId}`);
    const site = state.sites.find((item) => item.id === incident.siteId);
    if (site && isProposalMandatory(state, incident, site) && !proposal) errors.push(`Improvement proposal assessment missing for ${incident.btsId}`);
    if (proposal?.improvementRequired && !proposal.technicalProposal) errors.push(`Proposal details missing for ${incident.btsId}`);
  }
  if (activeUser.role !== "SDE") errors.push("Only Field Officer users can submit EOD.");
  return errors.slice(0, 12);
}

function Field({ label, value, onChange, required, type = "text" }: { label: string; value: unknown; onChange: (value: string) => void; required?: boolean; type?: string }) {
  return (
    <label className="text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}{required ? " *" : ""}</span>
      <input type={type} value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} className="w-full rounded border border-slate-200 px-3 py-2" />
    </label>
  );
}

function Area({ label, value, onChange, required }: { label: string; value: unknown; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}{required ? " *" : ""}</span>
      <textarea value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} rows={3} className="w-full rounded border border-slate-200 px-3 py-2" />
    </label>
  );
}

function Select({ label, value, options, onChange, placeholder }: { label: string; value: unknown; options: string[]; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <select value={String(value ?? (placeholder ? "" : options[0] ?? ""))} onChange={(event) => onChange(event.target.value)} className="w-full rounded border border-slate-200 px-3 py-2">
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function AccessPanel({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-5 shadow-soft">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{message}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded bg-slate-50 p-3">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-words font-medium">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-4 shadow-soft">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function ChartBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-4 shadow-soft">
      <h2 className="mb-3 font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function ExportButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center justify-center gap-2 rounded border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
      <Download size={17} />
      {label}
    </button>
  );
}
