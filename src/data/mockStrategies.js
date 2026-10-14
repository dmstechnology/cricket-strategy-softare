import { at } from './time';

// The four core strategy modules requested by the client. Descriptions and
// rules are EDITABLE SAMPLE TEXT — the client's exact methodology has not
// been provided, so nothing here represents their real strategy.
export const mockCoreStrategies = [
  {
    key: 'right-entry',
    name: 'Right Entry',
    tagline: 'Define entry conditions and record whether they were met.',
    description:
      'Configure sample entry conditions (overs, wickets, run rate, checklist items) and evaluate them against manually entered match values. The module records the decision only — it never places a bet.',
    rules: [
      'Only record an entry when every required condition is satisfied.',
      'Missing inputs trigger "Manual Review Required" instead of a guess.',
      'Write a reason for every Entry and No-Entry decision.',
    ],
    enabled: true,
    route: '/user/strategies/right-entry',
  },
  {
    key: 'live-tracking',
    name: 'Live Trading / Match Tracking',
    tagline: 'Keep a manual, chronological match-observation journal.',
    description:
      'Manually log score, wickets, overs and observations while a match is played. This is NOT a live score feed — every value is entered by a person and is unverified.',
    rules: [
      'Log an observation at least once per phase (powerplay, middle, death).',
      'Link observations to the related Right Entry record where relevant.',
      'Mark the match status when it changes.',
    ],
    enabled: true,
    route: '/user/strategies/live-tracking',
  },
  {
    key: 'book-profit',
    name: 'Book Profit',
    tagline: 'Record the planned target and the final hypothetical outcome.',
    description:
      'Set a target for a strategy record and record the exit value, reason and result. The result flows into P&L, analytics and the risk dashboard. Nothing is placed, settled or closed with any real counterparty.',
    rules: [
      'Set a target before recording the exit.',
      'Record the exit reason for every closed record.',
      'Target reached is evaluated using the configured target rule.',
    ],
    enabled: true,
    route: '/user/strategies/book-profit',
    config: { targetRule: 'net' },
  },
  {
    key: 'loss-cut',
    name: 'Strict Loss Cut',
    tagline: 'Configure demo loss limits and get warnings when they are exceeded.',
    description:
      'Compare recorded simulated results with configurable per-record, daily and session limits. Warnings are informational record-keeping only — they cannot stop any external transaction.',
    rules: [
      'Stop recording new entries for the session once a limit is exceeded.',
      'Write a review note for every limit breach.',
      '"Approaching Limit" warns at the configured percentage of a limit.',
    ],
    enabled: true,
    route: '/user/strategies/loss-cut',
  },
];

// Right Entry configurations. userId === null means an admin-provided template
// that every user can use.
export const mockEntryConfigs = [
  {
    id: 'EC-01',
    userId: null,
    name: 'Powerplay Stability Check',
    matchId: null,
    format: 'T20',
    requiredSituation: 'End of powerplay (overs 4–6) with a stable batting side.',
    conditions: [
      { id: 'c1', type: 'numeric', field: 'overs', operator: 'between', value: 4, value2: 6, required: true },
      { id: 'c2', type: 'numeric', field: 'wickets', operator: 'lte', value: 1, required: true },
      { id: 'c3', type: 'numeric', field: 'runRate', operator: 'gte', value: 7.5, required: true },
      { id: 'c4', type: 'checklist', label: 'Pitch report reviewed', required: true },
      { id: 'c5', type: 'checklist', label: 'No key-player injury reported', required: false },
    ],
    notes: 'Sample template. Thresholds are illustrative and should be replaced with the client’s rules.',
    status: 'Active',
    createdAt: at(-60, 10),
  },
  {
    id: 'EC-02',
    userId: null,
    name: 'Middle Overs Consolidation',
    matchId: null,
    format: 'ODI',
    requiredSituation: 'Overs 15–35 with no more than three wickets down.',
    conditions: [
      { id: 'c1', type: 'numeric', field: 'overs', operator: 'between', value: 15, value2: 35, required: true },
      { id: 'c2', type: 'numeric', field: 'wickets', operator: 'lte', value: 3, required: true },
      { id: 'c3', type: 'numeric', field: 'runRate', operator: 'gte', value: 5, required: true },
      { id: 'c4', type: 'checklist', label: 'Spin phase observed for 3+ overs', required: false },
    ],
    notes: 'Sample ODI template.',
    status: 'Active',
    createdAt: at(-58, 10),
  },
  {
    id: 'EC-03',
    userId: 'U-002',
    name: 'Death Overs Momentum',
    matchId: null,
    format: 'T20',
    requiredSituation: 'Overs 15+ with wickets in hand and a high scoring rate.',
    conditions: [
      { id: 'c1', type: 'numeric', field: 'overs', operator: 'gte', value: 15, required: true },
      { id: 'c2', type: 'numeric', field: 'wickets', operator: 'lte', value: 5, required: true },
      { id: 'c3', type: 'numeric', field: 'runRate', operator: 'gte', value: 8.5, required: true },
      { id: 'c4', type: 'numeric', field: 'oddsRef', operator: 'between', value: 1.5, value2: 2.5, required: false },
      { id: 'c5', type: 'checklist', label: 'Set batters at the crease', required: true },
    ],
    notes: 'Personal draft — price reference is a manual note, not market data.',
    status: 'Draft',
    createdAt: at(-20, 21),
  },
];

export const defaultRiskSettings = {
  maxLossPerRecord: 1500,
  dailyLimitEnabled: true,
  dailyLossLimit: 3000,
  sessionLimitEnabled: true,
  sessionLossLimit: 4000,
  maxRecordsPerSession: 6,
  approachingPct: 80,
  warnOnApproach: true,
  warnOnExceed: true,
  notes: 'Sample limits for the demo. Review before every session.',
  sessionStart: at(0, 0, 0),
};

export const mockAppSettings = {
  claimDefaultMessage:
    'Your claim request has been received. The estimated processing time is 2–3 days. This is a demonstration status message only and does not represent a real payment or payout commitment.',
  claimProcessingTime: '2–3 days',
  claimCategories: ['Demo Reward', 'Demo Wallet Adjustment', 'Promotional Credit (Demo)', 'Other'],
  requireKycForClaims: true,
  kycDocCategories: ['Demo ID Card', 'Sample Membership Card', 'Fictional Licence'],
  showDemoBanner: true,
};
