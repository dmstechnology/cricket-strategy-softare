import { dateOnly } from './time';

// Fictional teams and tournaments for demonstration only.
export const TEAMS = {
  CK: { name: 'Coastal Kings', short: 'CK', color: '#2563eb' },
  HH: { name: 'Highland Hawks', short: 'HH', color: '#ea580c' },
  MM: { name: 'Metro Mavericks', short: 'MM', color: '#7c3aed' },
  DF: { name: 'Desert Falcons', short: 'DF', color: '#ca8a04' },
  RR: { name: 'River City Rangers', short: 'RR', color: '#0d9488' },
  NT: { name: 'Northern Tigers', short: 'NT', color: '#dc2626' },
  EL: { name: 'Eastern Lions', short: 'EL', color: '#16a34a' },
  SS: { name: 'Southern Stars', short: 'SS', color: '#db2777' },
};

export const TOURNAMENTS = ['Premier T20 Cup (Demo)', 'Continental ODI Series (Demo)', 'Heritage Test Trophy (Demo)'];

const m = (id, a, b, tournament, format, dayOffset, time, venue, status, notes, extra = {}) => ({
  id,
  teamA: TEAMS[a],
  teamB: TEAMS[b],
  tournament,
  format,
  date: dateOnly(dayOffset),
  time,
  venue,
  status,
  notes,
  result: '',
  // Demo entry amount for a simple Entry Check (set by admin; 0 = free).
  entryAmount: format === 'T20' ? 100 : format === 'ODI' ? 200 : 300,
  ...extra,
});

export const mockMatches = [
  m('M-1001', 'CK', 'HH', TOURNAMENTS[0], 'T20', 0, '19:30', 'Harbour Oval', 'In Progress',
    'Track powerplay run rate vs. wickets lost before considering any entry record.'),
  m('M-1002', 'MM', 'DF', TOURNAMENTS[1], 'ODI', 0, '14:00', 'Central Arena', 'In Progress',
    'Middle overs (15–35) observation window. Note spin vs pace phases.'),
  m('M-1003', 'RR', 'NT', TOURNAMENTS[0], 'T20', 1, '15:30', 'Riverside Ground', 'Upcoming',
    'Dew factor likely in second innings — record conditions before any decision.'),
  m('M-1004', 'EL', 'SS', TOURNAMENTS[0], 'T20', 1, '19:30', 'Lions Park', 'Upcoming',
    'Both sides strong in death overs. Focus on overs 16–20 observations.'),
  m('M-1005', 'CK', 'MM', TOURNAMENTS[1], 'ODI', 3, '10:00', 'Harbour Oval', 'Upcoming',
    'Day match — track first 10 overs closely.'),
  m('M-1006', 'HH', 'EL', TOURNAMENTS[2], 'Test', 5, '09:30', 'Highland Stadium', 'Upcoming',
    'Multi-day fixture. Record session-wise observations only.'),
  m('M-1007', 'DF', 'SS', TOURNAMENTS[0], 'T20', 7, '19:30', 'Sandstone Park', 'Upcoming',
    'Sample note: compare with previous DF vs SS fixture.'),
  m('M-1008', 'NT', 'CK', TOURNAMENTS[0], 'T20', -2, '19:30', 'Northern Bowl', 'Completed',
    'Completed fixture used for sample strategy records.', { result: 'Northern Tigers won by 6 wickets (demo)' }),
  m('M-1009', 'SS', 'RR', TOURNAMENTS[1], 'ODI', -5, '14:00', 'Starlight Ground', 'Completed',
    'Completed fixture — review entry decisions against the final outcome.', { result: 'Southern Stars won by 34 runs (demo)' }),
  m('M-1010', 'HH', 'MM', TOURNAMENTS[0], 'T20', -9, '19:30', 'Highland Stadium', 'Abandoned',
    'Abandoned due to rain — records closed without result.', { result: 'No result — rain (demo)' }),
  m('M-1011', 'EL', 'DF', TOURNAMENTS[0], 'T20', -13, '15:30', 'Lions Park', 'Completed',
    'Sample completed fixture.', { result: 'Eastern Lions won by 12 runs (demo)' }),
  m('M-1012', 'CK', 'RR', TOURNAMENTS[0], 'T20', -7, '19:30', 'Harbour Oval', 'Completed',
    'Sample completed fixture.', { result: 'Coastal Kings won by 21 runs (demo)' }),
  m('M-1013', 'NT', 'MM', TOURNAMENTS[1], 'ODI', -11, '10:00', 'Northern Bowl', 'Completed',
    'Sample completed fixture.', { result: 'Metro Mavericks won by 3 wickets (demo)' }),
  m('M-1014', 'SS', 'HH', TOURNAMENTS[0], 'T20', -3, '15:30', 'Starlight Ground', 'Completed',
    'Sample completed fixture.', { result: 'Highland Hawks won by 8 wickets (demo)' }),
  m('M-1015', 'DF', 'NT', TOURNAMENTS[0], 'T20', -1, '19:30', 'Sandstone Park', 'Completed',
    'Sample completed fixture.', { result: 'Desert Falcons won by 4 runs (demo)' }),
];
