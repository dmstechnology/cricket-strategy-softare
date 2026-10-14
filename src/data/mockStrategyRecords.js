import { at } from './time';
import { mockEntryConfigs } from './mockStrategies';
import { evaluateEntry, calculatePnl, suggestCompliance } from '../utils/calculations';

// Right Entry records and P&L / Book Profit records.
// All values are FICTIONAL demo data; none represent real wagers or earnings.

const configById = Object.fromEntries(mockEntryConfigs.map((c) => [c.id, c]));

function entry(id, userId, configId, matchId, team, day, hour, min, inputs, decision, reason, notes, status) {
  const config = configById[configId];
  const evaluation = evaluateEntry(config, inputs);
  return {
    id,
    userId,
    configId,
    configName: config.name,
    matchId,
    team,
    entryAt: at(day, hour, min),
    score: inputs.score,
    wickets: inputs.wickets,
    overs: inputs.overs,
    oddsRef: inputs.oddsRef ?? '',
    checklist: inputs.checklist || {},
    evaluation,
    decision,
    compliance: suggestCompliance(evaluation.outcome, decision),
    reason,
    notes,
    status,
    createdAt: at(day, hour, min),
    updatedAt: at(day, hour, min),
  };
}

const ok = { c4: true, c5: true };

export const mockEntryRecords = [
  entry('RE-2001', 'U-002', 'EC-01', 'M-1011', 'EL', -13, 16, 5, { score: 46, wickets: 1, overs: 5.2, checklist: ok }, 'Entry', 'All powerplay conditions met.', 'Strong start, pitch flat.', 'Completed'),
  entry('RE-2002', 'U-002', 'EC-01', 'M-1011', 'DF', -13, 17, 40, { score: 38, wickets: 1, overs: 5.0, checklist: ok }, 'Entry', 'Run rate just above threshold.', 'Marginal — recorded for review.', 'Completed'),
  entry('RE-2003', 'U-002', 'EC-02', 'M-1013', 'NT', -11, 12, 30, { score: 104, wickets: 2, overs: 20.0, checklist: { c4: true } }, 'Entry', 'Stable middle overs.', '', 'Completed'),
  entry('RE-2004', 'U-002', 'EC-02', 'M-1013', 'MM', -11, 16, 10, { score: 88, wickets: 4, overs: 22.3, checklist: {} }, 'Entry', 'Entered despite 4 wickets — rule breach noted.', 'Did not follow wicket rule.', 'Completed'),
  entry('RE-2005', 'U-002', 'EC-01', 'M-1010', 'HH', -9, 20, 0, { score: 41, wickets: 0, overs: 4.4, checklist: ok }, 'Entry', 'Conditions met before rain.', 'Match abandoned.', 'Completed'),
  entry('RE-2006', 'U-002', 'EC-01', 'M-1012', 'CK', -7, 20, 5, { score: 55, wickets: 1, overs: 6.0, checklist: ok }, 'Entry', 'Powerplay criteria satisfied.', '', 'Completed'),
  entry('RE-2007', 'U-002', 'EC-01', 'M-1012', 'RR', -7, 21, 35, { score: 44, wickets: 1, overs: 5.5, checklist: ok }, 'Entry', 'Chasing side steady.', '', 'Completed'),
  entry('RE-2008', 'U-002', 'EC-01', 'M-1012', 'RR', -7, 22, 0, { score: 39, wickets: 2, overs: 5.0, checklist: { c4: true } }, 'Entry', 'Second record on same match.', 'Wicket condition failed.', 'Completed'),
  entry('RE-2009', 'U-002', 'EC-02', 'M-1009', 'SS', -5, 15, 30, { score: 96, wickets: 2, overs: 18.4, checklist: { c4: true } }, 'Entry', 'Middle overs conditions met.', '', 'Completed'),
  entry('RE-2010', 'U-002', 'EC-02', 'M-1009', 'RR', -5, 19, 0, { score: 71, wickets: 3, overs: 16.0, checklist: {} }, 'Entry', 'Conditions met at the minimum.', 'Collapsed shortly after.', 'Completed'),
  entry('RE-2011', 'U-002', 'EC-01', 'M-1014', 'SS', -3, 16, 0, { score: 29, wickets: 2, overs: 5.0, checklist: { c4: true } }, 'No Entry', 'Two wickets in powerplay.', 'Stayed out as per rules.', 'Closed'),
  entry('RE-2012', 'U-002', 'EC-01', 'M-1014', 'HH', -3, 17, 45, { score: 51, wickets: 0, overs: 5.4, checklist: ok }, 'Entry', 'Excellent start.', '', 'Completed'),
  entry('RE-2013', 'U-002', 'EC-01', 'M-1014', 'HH', -3, 18, 5, { score: 70, wickets: 1, overs: 8.0, checklist: ok }, 'Entry', 'Outside overs window, entered anyway.', 'Overs condition failed.', 'Completed'),
  entry('RE-2014', 'U-002', 'EC-01', 'M-1008', 'NT', -2, 20, 0, { score: 48, wickets: 1, overs: 5.5, checklist: ok }, 'Entry', 'All conditions satisfied.', '', 'Completed'),
  entry('RE-2015', 'U-002', 'EC-01', 'M-1008', 'CK', -2, 21, 40, { score: 52, wickets: 1, overs: 6.0, checklist: ok }, 'Entry', 'Chase on track.', '', 'Completed'),
  entry('RE-2016', 'U-002', 'EC-01', 'M-1015', 'DF', -1, 20, 5, { score: 49, wickets: 0, overs: 5.0, checklist: ok }, 'Entry', 'Steady openers.', '', 'Completed'),
  entry('RE-2017', 'U-002', 'EC-01', 'M-1001', 'CK', 0, 20, 10, { score: 52, wickets: 1, overs: 6.0, checklist: ok }, 'Entry', 'Powerplay conditions met.', 'Recorded during in-progress match.', 'Completed'),
  entry('RE-2018', 'U-002', 'EC-02', 'M-1002', 'MM', 0, 15, 20, { score: 102, wickets: 2, overs: 20.0, checklist: { c4: true } }, 'Entry', 'Middle overs stable.', 'Open — awaiting exit record.', 'Open'),
  entry('RE-2019', 'U-002', 'EC-01', 'M-1003', 'RR', 0, 9, 0, { score: '', wickets: '', overs: '', checklist: { c4: true } }, 'Manual Review', 'Pre-match plan; values to be entered during play.', 'Upcoming match.', 'Open'),
  // Other users (visible to Admin)
  entry('RE-3001', 'U-003', 'EC-01', 'M-1008', 'NT', -2, 20, 15, { score: 50, wickets: 1, overs: 6.0, checklist: ok }, 'Entry', 'Conditions met.', '', 'Completed'),
  entry('RE-3002', 'U-003', 'EC-02', 'M-1009', 'SS', -5, 15, 45, { score: 99, wickets: 2, overs: 19.0, checklist: { c4: true } }, 'Entry', 'Steady.', '', 'Completed'),
  entry('RE-3003', 'U-004', 'EC-01', 'M-1014', 'HH', -3, 17, 50, { score: 34, wickets: 3, overs: 5.0, checklist: {} }, 'No Entry', 'Too many wickets.', '', 'Closed'),
  entry('RE-3004', 'U-004', 'EC-01', 'M-1015', 'NT', -1, 21, 30, { score: 40, wickets: 2, overs: 5.3, checklist: ok }, 'Entry', 'Took a chance.', 'Rule breach.', 'Completed'),
  entry('RE-3005', 'U-006', 'EC-01', 'M-1001', 'HH', 0, 19, 55, { score: 47, wickets: 1, overs: 6.0, checklist: ok }, 'Entry', 'Conditions met.', '', 'Open'),
];

function pnl(id, userId, recordId, matchId, strategyKey, day, hour, input, extra) {
  const calc = calculatePnl(input);
  return {
    id,
    userId,
    recordId,
    matchId,
    strategyKey,
    method: input.method,
    entryValue: input.entryValue ?? '',
    exitValue: input.exitValue ?? '',
    positionSize: input.positionSize ?? '',
    recordedGain: input.recordedGain ?? '',
    costs: calc.costs,
    gross: calc.gross,
    net: calc.net,
    targetValue: extra.targetValue ?? '',
    exitReason: extra.exitReason || '',
    notes: extra.notes || '',
    status: calc.complete && extra.status !== 'Open' ? 'Completed' : 'Open',
    source: extra.source || 'pnl',
    exitAt: at(day, hour, 30),
    createdAt: at(day, hour, 30),
  };
}

const simple = (recordedGain, costs = 0) => ({ method: 'simple', recordedGain, costs });
const illus = (entryValue, exitValue, positionSize, costs = 0) => ({
  method: 'illustrative',
  entryValue,
  exitValue,
  positionSize,
  costs,
});

export const mockPnlRecords = [
  pnl('PL-5001', 'U-002', 'RE-2001', 'M-1011', 'right-entry', -13, 19, simple(1250, 50), { targetValue: 1000, exitReason: 'Target reached', source: 'book-profit' }),
  pnl('PL-5002', 'U-002', 'RE-2002', 'M-1011', 'right-entry', -13, 19, simple(-430, 20), { exitReason: 'Stop level reached' }),
  pnl('PL-5003', 'U-002', 'RE-2003', 'M-1013', 'right-entry', -11, 18, illus(1.8, 2.3, 1700, 50), { targetValue: 1000, exitReason: 'Manual exit before target', source: 'book-profit' }),
  pnl('PL-5004', 'U-002', 'RE-2004', 'M-1013', 'right-entry', -11, 18, simple(-1760, 40), { exitReason: 'Collapse in middle overs', notes: 'Rule breach on wickets — see review.' }),
  pnl('PL-5005', 'U-002', 'RE-2005', 'M-1010', 'right-entry', -9, 21, simple(0, 0), { exitReason: 'Match abandoned (no result)' }),
  pnl('PL-5006', 'U-002', 'RE-2006', 'M-1012', 'right-entry', -7, 22, simple(2150, 50), { targetValue: 2000, exitReason: 'Target reached', source: 'book-profit' }),
  pnl('PL-5007', 'U-002', 'RE-2007', 'M-1012', 'live-tracking', -7, 22, simple(680, 30), { targetValue: 1000, exitReason: 'Manual exit — momentum shift', source: 'book-profit' }),
  pnl('PL-5008', 'U-002', 'RE-2008', 'M-1012', 'right-entry', -7, 23, simple(-880, 20), { exitReason: 'Stop level reached' }),
  pnl('PL-5009', 'U-002', 'RE-2009', 'M-1009', 'right-entry', -5, 20, simple(-1650, 50), { exitReason: 'Wickets fell quickly' }),
  pnl('PL-5010', 'U-002', 'RE-2010', 'M-1009', 'right-entry', -5, 21, illus(2.1, 1.65, 3500, 25), { exitReason: 'Collapse', notes: 'Second loss of the day.' }),
  pnl('PL-5011', 'U-002', 'RE-2012', 'M-1014', 'right-entry', -3, 19, simple(1540, 40), { targetValue: 1500, exitReason: 'Target reached', source: 'book-profit' }),
  pnl('PL-5012', 'U-002', 'RE-2013', 'M-1014', 'right-entry', -3, 20, simple(420, 20), { exitReason: 'Manual exit' }),
  pnl('PL-5013', 'U-002', 'RE-2014', 'M-1008', 'right-entry', -2, 21, simple(-280, 20), { exitReason: 'Stop level reached' }),
  pnl('PL-5014', 'U-002', 'RE-2015', 'M-1008', 'live-tracking', -2, 22, simple(990, 40), { targetValue: 1200, exitReason: 'Match ended', source: 'book-profit' }),
  pnl('PL-5015', 'U-002', 'RE-2016', 'M-1015', 'right-entry', -1, 22, simple(1140, 40), { targetValue: 1000, exitReason: 'Target reached', source: 'book-profit' }),
  pnl('PL-5016', 'U-002', 'RE-2017', 'M-1001', 'right-entry', 0, 21, simple(-1230, 20), { exitReason: 'Wickets in quick succession', notes: 'Approaching the per-record limit.' }),
  pnl('PL-5017', 'U-002', 'RE-2018', 'M-1002', 'right-entry', 0, 16, { method: 'simple', recordedGain: '', costs: '' }, { targetValue: 1500, exitReason: '', notes: 'Open record — result not yet recorded.', status: 'Open' }),
  // Other users
  pnl('PL-6001', 'U-003', 'RE-3001', 'M-1008', 'right-entry', -2, 22, simple(860, 30), { targetValue: 800, exitReason: 'Target reached', source: 'book-profit' }),
  pnl('PL-6002', 'U-003', 'RE-3002', 'M-1009', 'right-entry', -5, 20, simple(-520, 20), { exitReason: 'Stop level reached' }),
  pnl('PL-6003', 'U-004', 'RE-3004', 'M-1015', 'right-entry', -1, 22, simple(-1900, 25), { exitReason: 'Collapse' }),
];

// Review notes for risk alerts, keyed by user id, then by alert id.
export const mockRiskReviews = {
  'U-002': {
    'rec-PL-5004': {
      note: 'Entered against the wicket rule. Will not override the checklist again.',
      at: at(-11, 22),
    },
  },
};
