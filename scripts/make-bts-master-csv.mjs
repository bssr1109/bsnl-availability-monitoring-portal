import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";

const input = "C:/Users/seshu/OneDrive/Desktop/New data.xlsx";
const output = "C:/Users/seshu/Documents/Codex/2026-07-15/files-mentioned-by-the-user-build/outputs/bts_master.csv";

function parsePerson(value) {
  const text = String(value ?? "").replace(/[\u2013\u2014]/g, "-").trim();
  const parts = text.split("-").map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) return { staffNo: parts[0], name: parts.slice(1).join(" - ") };
  return { staffNo: "", name: text };
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const workbook = XLSX.readFile(input);
const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "", raw: false });
const headers = ["site_id", "field_officer_staff_no", "field_officer_name", "active", "source", "updated_at"];
const seen = new Set();
const timestamp = new Date().toISOString();
let duplicatesSkipped = 0;

const outputRows = rows.flatMap((row) => {
  const siteId = String(row["Site ID"] || row.site_id || row.bts_ip_id || "").trim().toUpperCase();
  if (!siteId) return [];
  if (seen.has(siteId)) {
    duplicatesSkipped += 1;
    return [];
  }
  seen.add(siteId);

  const officer = parsePerson(row["SDE "] ?? row.SDE ?? row["Field Officer"]);
  return [{
    site_id: siteId,
    field_officer_staff_no: officer.staffNo,
    field_officer_name: officer.name,
    active: "true",
    source: "New data.xlsx",
    updated_at: timestamp
  }];
});

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(
  output,
  [headers.join(","), ...outputRows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\r\n")
);

console.log(JSON.stringify({
  output,
  sourceRows: rows.length,
  csvRows: outputRows.length,
  duplicatesSkipped,
  firstRows: outputRows.slice(0, 5)
}, null, 2));
