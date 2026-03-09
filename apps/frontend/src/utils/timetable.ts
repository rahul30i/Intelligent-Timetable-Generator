import type { TimetableEntry } from "../api/types";

export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function buildEntryMap(entries: TimetableEntry[]) {
  const map = new Map<string, TimetableEntry>();
  entries.forEach((entry) => {
    map.set(`${entry.dayOfWeek}-${entry.periodIndex}`, entry);
  });
  return map;
}
