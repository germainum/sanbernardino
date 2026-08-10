import { STALE_DATA_THRESHOLD_MIN } from "@san-bernardino/core";

export function updatedAgeMin(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
}

export function formatUpdatedLabel(iso: string): string {
  const minutes = updatedAgeMin(iso);
  if (minutes < 1) return "Mis à jour à l'instant";
  if (minutes === 1) return "Mis à jour il y a 1 min";
  if (minutes < 60) return `Mis à jour il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  return `Mis à jour il y a ${hours} h`;
}

export function isStale(iso: string): boolean {
  return updatedAgeMin(iso) >= STALE_DATA_THRESHOLD_MIN;
}
