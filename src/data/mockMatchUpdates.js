import { at } from './time';

// Manually entered match observations. These are NOT live scores and are not
// externally verified.
const u = (id, matchId, userId, battingTeam, score, wickets, overs, status, notes, day, h, mi, extra = {}) => ({
  id,
  matchId,
  userId,
  battingTeam,
  score,
  wickets,
  overs,
  status,
  notes,
  runRateNote: extra.runRateNote || '',
  relatedRecordId: extra.relatedRecordId || '',
  timestamp: at(day, h, mi),
});

export const mockMatchUpdates = [
  // M-1001 CK vs HH — in progress (T20)
  u('UPD-9001', 'M-1001', 'U-002', 'CK', 0, 0, 0, 'In Progress', 'Toss done, CK batting first. Pitch looks flat.', 0, 19, 32),
  u('UPD-9002', 'M-1001', 'U-002', 'CK', 28, 0, 3.0, 'In Progress', 'Cautious start, good timing from openers.', 0, 19, 48),
  u('UPD-9003', 'M-1001', 'U-002', 'CK', 52, 1, 6.0, 'In Progress', 'End of powerplay. Right Entry conditions checked.', 0, 20, 8, { relatedRecordId: 'RE-2017', runRateNote: 'Above 8 per over' }),
  u('UPD-9004', 'M-1001', 'U-002', 'CK', 84, 2, 10.0, 'In Progress', 'Spinner slowed scoring in overs 7–10.', 0, 20, 30),
  u('UPD-9005', 'M-1001', 'U-001', 'CK', 121, 3, 14.3, 'In Progress', 'Admin demo update: two quick wickets earlier, recovery since.', 0, 20, 58),
  // M-1002 MM vs DF — in progress (ODI)
  u('UPD-9011', 'M-1002', 'U-002', 'MM', 48, 1, 10.0, 'In Progress', 'Solid powerplay, one wicket.', 0, 14, 45),
  u('UPD-9012', 'M-1002', 'U-002', 'MM', 102, 2, 20.0, 'In Progress', 'Middle overs window open.', 0, 15, 20, { relatedRecordId: 'RE-2018' }),
  u('UPD-9013', 'M-1002', 'U-002', 'MM', 141, 3, 27.4, 'In Progress', 'Partnership building steadily.', 0, 15, 55),
  // M-1008 NT vs CK — completed
  u('UPD-9021', 'M-1008', 'U-002', 'NT', 48, 1, 5.5, 'In Progress', 'Good powerplay.', -2, 20, 0, { relatedRecordId: 'RE-2014' }),
  u('UPD-9022', 'M-1008', 'U-002', 'NT', 168, 7, 20.0, 'In Progress', 'NT finish with 168/7.', -2, 21, 5),
  u('UPD-9023', 'M-1008', 'U-002', 'CK', 52, 1, 6.0, 'In Progress', 'CK chase on track.', -2, 21, 40, { relatedRecordId: 'RE-2015' }),
  u('UPD-9024', 'M-1008', 'U-002', 'CK', 152, 9, 20.0, 'Completed', 'CK fall short. Match complete.', -2, 22, 50),
  // M-1009 SS vs RR — completed
  u('UPD-9031', 'M-1009', 'U-002', 'SS', 96, 2, 18.4, 'In Progress', 'Middle overs stable.', -5, 15, 30, { relatedRecordId: 'RE-2009' }),
  u('UPD-9032', 'M-1009', 'U-002', 'SS', 271, 8, 50.0, 'In Progress', 'SS finish strongly.', -5, 18, 0),
  u('UPD-9033', 'M-1009', 'U-002', 'RR', 237, 10, 46.2, 'Completed', 'RR bowled out. SS win.', -5, 21, 30),
  // M-1010 abandoned
  u('UPD-9041', 'M-1010', 'U-002', 'HH', 41, 0, 4.4, 'Abandoned', 'Rain stopped play, match abandoned.', -9, 20, 15, { relatedRecordId: 'RE-2005' }),
  // M-1014
  u('UPD-9051', 'M-1014', 'U-002', 'SS', 142, 8, 20.0, 'In Progress', 'SS post 142.', -3, 17, 0),
  u('UPD-9052', 'M-1014', 'U-002', 'HH', 146, 2, 16.1, 'Completed', 'HH chase easily.', -3, 19, 0),
];
