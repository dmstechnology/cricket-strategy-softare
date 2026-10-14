// Builds every analytics dataset from the shared records, so charts always
// reflect the current in-memory state.
import { ENTRY_OUTCOMES, summarizePnl } from './calculations';
import { shortDate, toDateKey } from './formatters';

export const STRATEGY_LABELS = {
  'right-entry': 'Right Entry',
  'live-tracking': 'Live Tracking',
  'book-profit': 'Book Profit',
  'loss-cut': 'Loss Cut',
};

const dayLabel = (key) => shortDate(`${key}T12:00:00`);

export function pnlTrend(records) {
  const byDay = new Map();
  records
    .filter((r) => r.status === 'Completed' && Number.isFinite(r.net))
    .forEach((r) => {
      const k = toDateKey(r.exitAt || r.createdAt);
      byDay.set(k, (byDay.get(k) || 0) + r.net);
    });
  let cum = 0;
  return [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, net]) => {
      cum += net;
      return { key: k, label: dayLabel(k), net: Math.round(net * 100) / 100, cumulative: Math.round(cum * 100) / 100 };
    });
}

// Book Profit records are grouped under "Book Profit" because that's the workflow
// the user used to close them; other records use their strategy key.
export function strategyPerformance(records) {
  const map = new Map();
  records
    .filter((r) => r.status === 'Completed' && Number.isFinite(r.net))
    .forEach((r) => {
      const key = r.source === 'book-profit' ? 'book-profit' : r.strategyKey || 'right-entry';
      const cur = map.get(key) || { name: STRATEGY_LABELS[key] || key, net: 0, count: 0 };
      cur.net += r.net;
      cur.count += 1;
      map.set(key, cur);
    });
  return [...map.values()].map((d) => ({ ...d, net: Math.round(d.net * 100) / 100 }));
}

export function complianceCounts(entryRecords) {
  const counts = { satisfied: 0, notSatisfied: 0, review: 0, completed: 0 };
  entryRecords.forEach((r) => {
    const o = r.evaluation?.outcome;
    if (o === 'Entry Completed') counts.completed += 1;
    else if (o === ENTRY_OUTCOMES.SATISFIED) counts.satisfied += 1;
    else if (o === ENTRY_OUTCOMES.NOT_SATISFIED) counts.notSatisfied += 1;
    else counts.review += 1;
  });
  const compliant = entryRecords.filter((r) => r.compliance === 'Compliant').length;
  const rate = entryRecords.length ? (compliant / entryRecords.length) * 100 : null;
  return { counts, rate, compliant };
}

export function activitySeries(updates, entryRecords) {
  const map = new Map();
  const bump = (iso, field) => {
    const k = toDateKey(iso);
    const cur = map.get(k) || { key: k, updates: 0, records: 0 };
    cur[field] += 1;
    map.set(k, cur);
  };
  updates.forEach((u) => bump(u.timestamp, 'updates'));
  entryRecords.forEach((r) => bump(r.createdAt, 'records'));
  return [...map.values()].sort((a, b) => (a.key < b.key ? -1 : 1)).map((d) => ({ ...d, label: dayLabel(d.key) }));
}

export function breachSeries(alerts) {
  const map = new Map();
  alerts.forEach((a) => {
    const k = toDateKey(a.at);
    const cur = map.get(k) || { key: k, exceeded: 0, approaching: 0 };
    if (a.level === 'Limit Exceeded') cur.exceeded += 1;
    else cur.approaching += 1;
    map.set(k, cur);
  });
  return [...map.values()].sort((a, b) => (a.key < b.key ? -1 : 1)).map((d) => ({ ...d, label: dayLabel(d.key) }));
}

export function buildAnalytics({ pnlRecords, entryRecords, matchUpdates, alerts }) {
  const pnl = summarizePnl(pnlRecords);
  const compliance = complianceCounts(entryRecords);
  const trackedMatchIds = new Set([
    ...matchUpdates.map((u) => u.matchId),
    ...entryRecords.map((r) => r.matchId),
  ]);
  return {
    pnl,
    compliance,
    trend: pnlTrend(pnlRecords),
    byStrategy: strategyPerformance(pnlRecords),
    activity: activitySeries(matchUpdates, entryRecords),
    breaches: breachSeries(alerts),
    completed: pnlRecords.filter((r) => r.status === 'Completed').length,
    incomplete: pnlRecords.filter((r) => r.status !== 'Completed').length,
    matchesTracked: trackedMatchIds.size,
    breachCount: alerts.filter((a) => a.level === 'Limit Exceeded').length,
  };
}
