// Core calculation engine for the demo. Every function here is pure so the
// results can be recomputed from shared state whenever records change.
// All monetary figures are SIMULATED and carry no real-world meaning.

import { isValidNumber, oversToBalls } from './validation';
import { toDateKey } from './formatters';

/* ------------------------------------------------------------------ */
/* Match helpers                                                       */
/* ------------------------------------------------------------------ */

export function runRate(score, overs) {
  const balls = oversToBalls(overs);
  if (!isValidNumber(score) || balls <= 0) return null;
  return Number(score) / (balls / 6);
}

// Latest manual update for a match (updates are stored newest-last or any order).
export function latestUpdateFor(matchId, updates) {
  return updates
    .filter((u) => u.matchId === matchId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
}

export function matchTitle(match) {
  if (!match) return 'Unknown match';
  return `${match.teamA.short} vs ${match.teamB.short}`;
}

/* ------------------------------------------------------------------ */
/* Right Entry evaluation                                              */
/* ------------------------------------------------------------------ */

export const CONDITION_FIELDS = {
  score: 'Current score (runs)',
  wickets: 'Wickets fallen',
  overs: 'Overs completed',
  runRate: 'Current run rate',
  oddsRef: 'Manual price reference',
};

export const OPERATORS = {
  gte: '≥',
  lte: '≤',
  between: 'between',
  eq: '=',
};

export const ENTRY_OUTCOMES = {
  SATISFIED: 'Conditions Satisfied',
  NOT_SATISFIED: 'Conditions Not Satisfied',
  REVIEW: 'Manual Review Required',
};

export function describeCondition(c) {
  if (c.type === 'checklist') return c.label;
  const field = CONDITION_FIELDS[c.field] || c.field;
  if (c.operator === 'between') return `${field} between ${c.value} and ${c.value2}`;
  return `${field} ${OPERATORS[c.operator] || c.operator} ${c.value}`;
}

function inputValueFor(field, inputs) {
  if (field === 'runRate') return runRate(inputs.score, inputs.overs);
  const raw = inputs[field];
  return isValidNumber(raw) ? Number(raw) : null;
}

/**
 * Evaluate a Right Entry configuration against manually entered values.
 *  - Numeric conditions compare the entered value with the configured threshold.
 *  - Checklist conditions are ticked manually by the user.
 *  - A required numeric condition with a missing input => Manual Review Required.
 *  - Any failed required condition => Conditions Not Satisfied.
 *  - Optional conditions are shown but never change the outcome.
 */
export function evaluateEntry(config, inputs) {
  const conditions = config?.conditions || [];
  const results = conditions.map((c) => {
    let passed = null;
    let actual = null;
    if (c.type === 'checklist') {
      passed = Boolean(inputs.checklist?.[c.id]);
      actual = passed ? 'Ticked' : 'Not ticked';
    } else {
      actual = inputValueFor(c.field, inputs);
      const v = Number(c.value);
      const v2 = Number(c.value2);
      if (actual !== null && isValidNumber(c.value)) {
        if (c.operator === 'gte') passed = actual >= v;
        else if (c.operator === 'lte') passed = actual <= v;
        else if (c.operator === 'eq') passed = actual === v;
        else if (c.operator === 'between') passed = actual >= Math.min(v, v2) && actual <= Math.max(v, v2);
      }
    }
    return { id: c.id, label: describeCondition(c), required: c.required !== false, passed, actual };
  });

  const required = results.filter((r) => r.required);
  const passedCount = results.filter((r) => r.passed === true).length;
  let outcome;
  if (required.length === 0) outcome = ENTRY_OUTCOMES.REVIEW;
  else if (required.some((r) => r.passed === false)) outcome = ENTRY_OUTCOMES.NOT_SATISFIED;
  else if (required.some((r) => r.passed === null)) outcome = ENTRY_OUTCOMES.REVIEW;
  else outcome = ENTRY_OUTCOMES.SATISFIED;

  return {
    results,
    outcome,
    passedCount,
    total: results.length,
    score: results.length ? Math.round((passedCount / results.length) * 100) : 0,
  };
}

// Suggest a compliance label by comparing the user's decision with the evaluation.
export function suggestCompliance(outcome, decision) {
  if (decision === 'Manual Review') return outcome === ENTRY_OUTCOMES.REVIEW ? 'Compliant' : 'Partially Compliant';
  if (decision === 'Entry') return outcome === ENTRY_OUTCOMES.SATISFIED ? 'Compliant' : 'Non-Compliant';
  // "No Entry" is always within the rules (staying out never breaks an entry rule).
  return 'Compliant';
}

/* ------------------------------------------------------------------ */
/* Profit & Loss                                                       */
/* ------------------------------------------------------------------ */

export const PNL_METHODS = {
  simple: {
    key: 'simple',
    name: 'Simple accounting record',
    formula: 'Net Result = Recorded Gain/Loss − Recorded Costs',
    description:
      'Use when you already know the hypothetical gain or loss for the record. Costs default to 0 if left empty.',
  },
  illustrative: {
    key: 'illustrative',
    name: 'Illustrative entry/exit (sample)',
    formula: 'Gross = (Exit Value − Entry Value) × Demo Position Size;  Net = Gross − Recorded Costs',
    description:
      'An ILLUSTRATIVE sample formula only. It assumes a linear value change and does not model any real exchange, odds format or settlement rule. Replace with the client-approved formula before any real use.',
  },
};

/**
 * Returns { complete, missing[], errors{}, gross, costs, net }.
 * Results are only produced for complete, numeric inputs.
 */
export function calculatePnl(input) {
  const method = input.method || 'simple';
  const errors = {};
  const missing = [];

  const costsRaw = input.costs;
  let costs = 0;
  if (costsRaw !== '' && costsRaw !== null && costsRaw !== undefined) {
    if (!isValidNumber(costsRaw)) errors.costs = 'Costs must be a number.';
    else if (Number(costsRaw) < 0) errors.costs = 'Costs cannot be negative.';
    else costs = Number(costsRaw);
  }

  let gross = null;
  if (method === 'illustrative') {
    ['entryValue', 'exitValue', 'positionSize'].forEach((k) => {
      if (input[k] === '' || input[k] === null || input[k] === undefined) missing.push(k);
      else if (!isValidNumber(input[k])) errors[k] = 'Must be a number.';
    });
    if (isValidNumber(input.positionSize) && Number(input.positionSize) <= 0) {
      errors.positionSize = 'Position size must be greater than 0.';
    }
    if (!missing.length && !Object.keys(errors).length) {
      gross = (Number(input.exitValue) - Number(input.entryValue)) * Number(input.positionSize);
    }
  } else {
    if (input.recordedGain === '' || input.recordedGain === null || input.recordedGain === undefined) {
      missing.push('recordedGain');
    } else if (!isValidNumber(input.recordedGain)) {
      errors.recordedGain = 'Must be a number (use a minus sign for a loss).';
    } else {
      gross = Number(input.recordedGain);
    }
  }

  const complete = gross !== null && !missing.length && !Object.keys(errors).length;
  const round = (n) => Math.round(n * 100) / 100;
  return {
    method,
    complete,
    missing,
    errors,
    gross: complete ? round(gross) : null,
    costs: round(costs),
    net: complete ? round(gross - costs) : null,
  };
}

export const TARGET_RULES = {
  net: 'Target reached when Net Result ≥ Target',
  gross: 'Target reached when Gross Result ≥ Target',
};

export function targetReached(record, rule = 'net') {
  if (!isValidNumber(record.targetValue) || Number(record.targetValue) === 0) return null;
  const compare = rule === 'gross' ? record.gross : record.net;
  if (compare === null || compare === undefined) return null;
  return Number(compare) >= Number(record.targetValue);
}

export function summarizePnl(records) {
  const completed = records.filter((r) => r.status === 'Completed' && Number.isFinite(r.net));
  const gains = completed.filter((r) => r.net > 0).reduce((s, r) => s + r.net, 0);
  const losses = completed.filter((r) => r.net < 0).reduce((s, r) => s + r.net, 0);
  const net = gains + losses;
  const costs = completed.reduce((s, r) => s + (r.costs || 0), 0);
  return {
    count: completed.length,
    wins: completed.filter((r) => r.net > 0).length,
    lossesCount: completed.filter((r) => r.net < 0).length,
    flat: completed.filter((r) => r.net === 0).length,
    gains,
    losses,
    net,
    costs,
    average: completed.length ? net / completed.length : null,
  };
}

function weekKey(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  return toDateKey(d);
}

// Group completed records into day / week / month buckets.
export function periodSummaries(records, period = 'day') {
  const map = new Map();
  records
    .filter((r) => r.status === 'Completed' && Number.isFinite(r.net))
    .forEach((r) => {
      const at = r.exitAt || r.createdAt;
      let key;
      if (period === 'week') key = weekKey(at);
      else if (period === 'month') key = toDateKey(at).slice(0, 7);
      else key = toDateKey(at);
      const cur = map.get(key) || { key, count: 0, gains: 0, losses: 0, net: 0 };
      cur.count += 1;
      if (r.net > 0) cur.gains += r.net;
      else cur.losses += r.net;
      cur.net += r.net;
      map.set(key, cur);
    });
  return [...map.values()].sort((a, b) => (a.key < b.key ? 1 : -1));
}

/* ------------------------------------------------------------------ */
/* Strict Loss-Cut / risk evaluation                                   */
/* ------------------------------------------------------------------ */

export const RISK_STATUS = {
  OK: 'Within Limit',
  NEAR: 'Approaching Limit',
  OVER: 'Limit Exceeded',
  REVIEW: 'Review Required',
};

const lossOf = (net) => (net < 0 ? -net : 0);

function levelFor(loss, limit, pct) {
  if (!limit || limit <= 0) return null;
  if (loss > limit) return RISK_STATUS.OVER;
  if (loss >= (limit * pct) / 100) return RISK_STATUS.NEAR;
  return null;
}

/**
 * Compare completed P&L records with the configured limits.
 * Returns current metrics, an overall status and a derived alert history.
 * Alerts are derived (not stored) so editing a record always keeps the
 * history consistent; review notes are stored separately by alert id.
 */
export function evaluateRisk(records, settings, reviews = {}, now = new Date()) {
  const pct = Number(settings.approachingPct) || 80;
  const completed = records
    .filter((r) => r.status === 'Completed' && Number.isFinite(r.net))
    .sort((a, b) => new Date(a.exitAt || a.createdAt) - new Date(b.exitAt || b.createdAt));
  const alerts = [];

  // 1. Per-record loss limit
  completed.forEach((r) => {
    const loss = lossOf(r.net);
    const level = levelFor(loss, Number(settings.maxLossPerRecord), pct);
    if (level) {
      alerts.push({
        id: `rec-${r.id}`,
        scope: 'Per-record limit',
        level,
        recordId: r.id,
        matchId: r.matchId,
        userId: r.userId,
        amount: loss,
        limit: Number(settings.maxLossPerRecord),
        at: r.exitAt || r.createdAt,
      });
    }
  });

  // 2. Daily loss limit
  const byDay = new Map();
  completed.forEach((r) => {
    const k = toDateKey(r.exitAt || r.createdAt);
    const cur = byDay.get(k) || { net: 0, last: null, ids: [] };
    cur.net += r.net;
    cur.last = r.exitAt || r.createdAt;
    cur.ids.push(r.id);
    byDay.set(k, cur);
  });
  if (settings.dailyLimitEnabled) {
    byDay.forEach((v, k) => {
      const loss = lossOf(v.net);
      const level = levelFor(loss, Number(settings.dailyLossLimit), pct);
      if (level) {
        alerts.push({
          id: `day-${k}`,
          scope: 'Daily limit',
          level,
          recordId: v.ids[v.ids.length - 1],
          relatedIds: v.ids,
          amount: loss,
          limit: Number(settings.dailyLossLimit),
          at: v.last,
        });
      }
    });
  }

  // 3. Session limits (session = records since the user's session start)
  const sessionStart = new Date(settings.sessionStart || 0);
  const sessionRecords = completed.filter((r) => new Date(r.exitAt || r.createdAt) >= sessionStart);
  const sessionLoss = lossOf(sessionRecords.reduce((s, r) => s + r.net, 0));
  const lastSession = sessionRecords[sessionRecords.length - 1];
  if (settings.sessionLimitEnabled) {
    const level = levelFor(sessionLoss, Number(settings.sessionLossLimit), pct);
    if (level) {
      alerts.push({
        id: `session-${settings.sessionStart}`,
        scope: 'Session limit',
        level,
        recordId: lastSession?.id,
        relatedIds: sessionRecords.map((r) => r.id),
        amount: sessionLoss,
        limit: Number(settings.sessionLossLimit),
        at: lastSession ? lastSession.exitAt || lastSession.createdAt : settings.sessionStart,
      });
    }
  }
  const maxRecords = Number(settings.maxRecordsPerSession);
  if (maxRecords > 0 && sessionRecords.length > maxRecords) {
    alerts.push({
      id: `count-${settings.sessionStart}`,
      scope: 'Records per session',
      level: RISK_STATUS.OVER,
      recordId: lastSession?.id,
      amount: sessionRecords.length,
      limit: maxRecords,
      isCount: true,
      at: lastSession ? lastSession.exitAt || lastSession.createdAt : settings.sessionStart,
    });
  }

  alerts.forEach((a) => {
    a.review = reviews[a.id] || null;
  });
  alerts.sort((a, b) => new Date(b.at) - new Date(a.at));

  // Current metrics
  const todayKey = toDateKey(now);
  const todayLoss = lossOf(byDay.get(todayKey)?.net || 0);
  const current = {
    todayLoss,
    sessionLoss,
    sessionCount: sessionRecords.length,
    dailyRemaining: settings.dailyLimitEnabled ? Math.max(0, Number(settings.dailyLossLimit) - todayLoss) : null,
    sessionRemaining: settings.sessionLimitEnabled
      ? Math.max(0, Number(settings.sessionLossLimit) - sessionLoss)
      : null,
    recordsRemaining: maxRecords > 0 ? Math.max(0, maxRecords - sessionRecords.length) : null,
  };

  const currentLevels = [
    settings.dailyLimitEnabled ? levelFor(todayLoss, Number(settings.dailyLossLimit), pct) : null,
    settings.sessionLimitEnabled ? levelFor(sessionLoss, Number(settings.sessionLossLimit), pct) : null,
    maxRecords > 0 && sessionRecords.length > maxRecords ? RISK_STATUS.OVER : null,
    maxRecords > 0 && sessionRecords.length >= Math.ceil((maxRecords * pct) / 100) ? RISK_STATUS.NEAR : null,
    ...alerts
      .filter((a) => a.scope === 'Per-record limit' && !a.review && sessionRecords.some((r) => r.id === a.recordId))
      .map((a) => a.level),
  ];

  let status = RISK_STATUS.OK;
  if (currentLevels.includes(RISK_STATUS.OVER)) status = RISK_STATUS.OVER;
  else if (currentLevels.includes(RISK_STATUS.NEAR)) status = RISK_STATUS.NEAR;
  else if (alerts.some((a) => a.level === RISK_STATUS.OVER && !a.review)) status = RISK_STATUS.REVIEW;

  const breaches = alerts.filter((a) => a.level === RISK_STATUS.OVER);
  return { status, alerts, breaches, current, sessionRecords };
}

/* ------------------------------------------------------------------ */
/* Wallet                                                              */
/* ------------------------------------------------------------------ */

export function walletSummary(transactions) {
  const done = transactions.filter((t) => t.status === 'Completed');
  const credits = done.filter((t) => t.type === 'Credit').reduce((s, t) => s + t.amount, 0);
  const debits = done.filter((t) => t.type === 'Debit').reduce((s, t) => s + t.amount, 0);
  const pending = transactions.filter((t) => t.status === 'Pending').reduce((s, t) => s + t.amount, 0);
  return { balance: credits - debits, credits, debits, pending };
}

/* ------------------------------------------------------------------ */
/* CSV export                                                          */
/* ------------------------------------------------------------------ */

export function downloadCsv(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
