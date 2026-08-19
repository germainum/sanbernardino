import { STALE_DATA_THRESHOLD_MIN } from "@san-bernardino/core";
import type { Dictionary } from "../i18n";

export function updatedAgeMin(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
}

export function formatUpdatedLabel(iso: string, t: Dictionary): string {
  const minutes = updatedAgeMin(iso);
  if (minutes < 1) return t.format.updatedNow;
  if (minutes === 1) return t.format.updatedOneMinuteAgo;
  if (minutes < 60) return t.format.updatedMinutesAgo(minutes);
  const hours = Math.round(minutes / 60);
  return t.format.updatedHoursAgo(hours);
}

export function isStale(iso: string): boolean {
  return updatedAgeMin(iso) >= STALE_DATA_THRESHOLD_MIN;
}
