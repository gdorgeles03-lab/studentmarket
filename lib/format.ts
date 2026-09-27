export function formatPrix(prix?: number | null): string {
  if (prix === undefined || prix === null || isNaN(prix)) return "0";
  return Math.round(prix).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}