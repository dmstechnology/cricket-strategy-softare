// Mock data dates are generated relative to the moment the app loads,
// so the demo always shows "recent" activity.
export function at(daysOffset, hour = 12, minute = 0) {
  const now = new Date();
  if (daysOffset === 0) {
    // Same-day items are spread across the part of today that has already
    // elapsed, so nothing appears to be in the future and ordering is kept.
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const fraction = (hour * 60 + minute) / (24 * 60);
    return new Date(start.getTime() + fraction * (now - start)).toISOString();
  }
  const d = new Date(now);
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function dateOnly(daysOffset) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function hoursAgo(h) {
  return new Date(Date.now() - h * 3600 * 1000).toISOString();
}
