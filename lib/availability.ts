import { differenceInMinutes, endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import type { OutageIncident, Site } from "./types";

export const TARGET_AVAILABILITY = 98;

export function minutesInMonth(monthIso: string) {
  const date = parseISO(monthIso);
  return differenceInMinutes(endOfMonth(date), startOfMonth(date)) + 1;
}

export function mergeIntervals(intervals: Array<{ start: string; end: string }>) {
  const sorted = intervals
    .map((item) => ({ start: parseISO(item.start), end: parseISO(item.end) }))
    .filter((item) => item.end > item.start)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const merged: typeof sorted = [];
  for (const interval of sorted) {
    const last = merged[merged.length - 1];
    if (!last || interval.start > last.end) {
      merged.push({ ...interval });
    } else if (interval.end > last.end) {
      last.end = interval.end;
    }
  }

  return merged.map((item) => ({
    start: item.start.toISOString(),
    end: item.end.toISOString(),
    minutes: differenceInMinutes(item.end, item.start)
  }));
}

export function downtimeForSite(siteId: string, incidents: OutageIncident[], monthIso: string) {
  const monthKey = format(parseISO(monthIso), "yyyy-MM");
  const intervals = incidents
    .filter((incident) => incident.siteId === siteId && incident.downTime.startsWith(monthKey))
    .map((incident) => ({ start: incident.downTime, end: incident.upTime }));
  return mergeIntervals(intervals).reduce((sum, item) => sum + item.minutes, 0);
}

export function availabilityPercent(downtimeMinutes: number, totalMinutes: number) {
  return Math.max(0, ((totalMinutes - downtimeMinutes) / totalMinutes) * 100);
}

export function availabilityForSite(site: Site, incidents: OutageIncident[], monthIso: string) {
  const total = minutesInMonth(monthIso);
  const downtime = downtimeForSite(site.id, incidents, monthIso);
  const permissible = total * ((100 - TARGET_AVAILABILITY) / 100);
  const current = availabilityPercent(downtime, total);
  const dayOfMonth = parseISO(monthIso).getDate();
  const projectedDowntime = Math.round((downtime / Math.max(1, dayOfMonth)) * new Date(monthIso).getDate());
  const projected = availabilityPercent(projectedDowntime, total);

  return {
    site,
    totalMinutes: total,
    downtimeMinutes: downtime,
    availability: current,
    permissibleDowntime: permissible,
    remainingMargin: permissible - downtime,
    gapFromTarget: current - TARGET_AVAILABILITY,
    projectedAvailability: projected,
    requiredAvailabilityRemaining: downtime > permissible ? 100 : TARGET_AVAILABILITY
  };
}
