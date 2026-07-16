import * as XLSX from "xlsx";
import { mkdirSync } from "fs";
import { join } from "path";
import { sites, outageIncidents } from "../lib/seed";

const rows = outageIncidents.slice(0, 20).map((incident) => {
  const site = sites.find((item) => item.id === incident.siteId);
  return {
    circle_id: "TS",
    ssa_id: "TSWAR",
    ssa_name: site?.ssa ?? "WARANGAL",
    sdca_name: site?.sdca ?? "",
    bts_id: "",
    bts_name: site?.btsName ?? incident.btsId,
    bts_site_id: "",
    bts_ip_id: site?.btsId ?? incident.btsId,
    bts_type: site?.technology ?? "",
    site_type: site?.siteType ?? "",
    bts_down_dt: incident.downTime,
    bts_up_dt: incident.upTime,
    dur: incident.durationMinutes,
    alarm_code: incident.alarmCode,
    vendor_name: site?.vendor ?? "",
    description: incident.description.split(" - ")[0] ?? incident.description,
    addl_info: incident.description.split(" - ").slice(1).join(" - "),
    fault_type: ""
  };
});

const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Outage Upload");
mkdirSync("public", { recursive: true });
XLSX.writeFile(workbook, join("public", "sample-outage-upload.xlsx"));
