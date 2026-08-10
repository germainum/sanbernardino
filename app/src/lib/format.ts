export function formatUpdatedLabel(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "Mis à jour à l'instant";
  if (minutes === 1) return "Mis à jour il y a 1 min";
  if (minutes < 60) return `Mis à jour il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  return `Mis à jour il y a ${hours} h`;
}
