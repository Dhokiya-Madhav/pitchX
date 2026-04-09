/**
 * Booking cost: `hoursBetween(start, end) * pricePerHour` (same-day slots; if end ≤ start, spans midnight).
 */

function parseTimeToMinutes(t: string): number {
  const m = String(t).match(/^(\d{1,2}):(\d{2})/);
  if (!m) return 0;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

export function slotDurationHours(startTime: string, endTime: string): number {
  const start = parseTimeToMinutes(startTime);
  let end = parseTimeToMinutes(endTime);
  if (end <= start) end += 24 * 60;
  return (end - start) / 60;
}

export function slotSubtotalRupees(params: {
  startTime: string;
  endTime: string;
  pricePerHour: number;
}): number {
  const hours = slotDurationHours(params.startTime, params.endTime);
  const rate = Number(params.pricePerHour);
  if (!Number.isFinite(hours) || !Number.isFinite(rate)) return 0;
  return hours * rate;
}
