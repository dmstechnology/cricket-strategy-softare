import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { mockUsers } from '../data/mockUsers';
import { mockMatches } from '../data/mockMatches';
import {
  mockCoreStrategies,
  mockEntryConfigs,
  defaultRiskSettings,
  mockAppSettings,
} from '../data/mockStrategies';
import { mockEntryRecords, mockPnlRecords, mockRiskReviews } from '../data/mockStrategyRecords';
import { mockMatchUpdates } from '../data/mockMatchUpdates';
import { mockClaims } from '../data/mockClaims';
import { mockTransactions, mockKycRecords } from '../data/mockTransactions';
import { mockNotifications } from '../data/mockNotifications';
import { evaluateRisk, RISK_STATUS, walletSummary } from '../utils/calculations';
import { formatAmount } from '../utils/formatters';

// Single in-memory store for the whole demo. Data resets on page refresh and
// nothing is sent to any server.

const AppDataContext = createContext(null);

const clone = (v) => JSON.parse(JSON.stringify(v));
const nowIso = () => new Date().toISOString();

function nextId(prefix, list, pad = 4) {
  const max = list.reduce((m, item) => {
    const n = parseInt(String(item.id).replace(/\D/g, '').slice(-pad), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `${prefix}${String(max + 1).padStart(pad, '0')}`;
}

function initialState() {
  return {
    users: clone(mockUsers),
    matches: clone(mockMatches),
    coreStrategies: clone(mockCoreStrategies),
    entryConfigs: clone(mockEntryConfigs),
    entryRecords: clone(mockEntryRecords),
    matchUpdates: clone(mockMatchUpdates),
    pnlRecords: clone(mockPnlRecords),
    riskSettings: {},
    riskReviews: clone(mockRiskReviews),
    transactions: clone(mockTransactions),
    kycRecords: clone(mockKycRecords),
    claims: clone(mockClaims),
    notifications: clone(mockNotifications),
    settings: clone(mockAppSettings),
    defaultRisk: clone(defaultRiskSettings),
  };
}

export function AppDataProvider({ children }) {
  // The ref always holds the latest state so actions can compute ids and
  // results synchronously (and consecutive actions in one tick see each other).
  const stateRef = useRef(null);
  if (stateRef.current === null) stateRef.current = initialState();
  const [state, setRawState] = useState(stateRef.current);

  const setState = useCallback((updater) => {
    const next = typeof updater === 'function' ? updater(stateRef.current) : updater;
    stateRef.current = next;
    setRawState(next);
  }, []);

  const patch = useCallback((key, updater) => {
    setState((s) => ({ ...s, [key]: typeof updater === 'function' ? updater(s[key]) : updater }));
  }, [setState]);

  /* ---------------- Notifications ---------------- */
  const pushNotification = useCallback(
    (n) => {
      setState((s) => {
        const id = `N-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        const item = {
          kind: 'system',
          type: 'info',
          published: true,
          readBy: [],
          createdAt: nowIso(),
          ...n,
          id,
        };
        return { ...s, notifications: [item, ...s.notifications] };
      });
    },
    [setState]
  );

  const actions = useMemo(() => {
    /* ---------------- Users ---------------- */
    const addUser = (data) => {
      let created;
      setState((s) => {
        created = {
          id: nextId('U-', s.users, 3),
          role: 'user',
          status: 'Active',
          registeredAt: nowIso(),
          ...data,
        };
        return {
          ...s,
          users: [...s.users, created],
          transactions: [
            ...s.transactions,
            {
              id: nextId('TXN-', s.transactions),
              userId: created.id,
              type: 'Credit',
              amount: 10000,
              description: 'Demo welcome credit',
              status: 'Completed',
              createdAt: nowIso(),
            },
          ],
          notifications: [
            {
              id: `N-new-${created.id}`,
              kind: 'system',
              audience: 'admins',
              type: 'info',
              title: 'New demo user registered',
              message: `${created.name} (@${created.username}) signed up.`,
              published: true,
              readBy: [],
              createdAt: nowIso(),
            },
            ...s.notifications,
          ],
        };
      });
      return created;
    };
    const updateUser = (id, changes) =>
      patch('users', (list) => list.map((u) => (u.id === id ? { ...u, ...changes } : u)));

    /* ---------------- Matches ---------------- */
    const addMatch = (data) =>
      patch('matches', (list) => [...list, { ...data, id: nextId('M-', list) }]);
    const updateMatch = (id, changes) =>
      patch('matches', (list) => list.map((m) => (m.id === id ? { ...m, ...changes } : m)));
    const deleteMatch = (id) => patch('matches', (list) => list.filter((m) => m.id !== id));

    /* ---------------- Strategies ---------------- */
    const updateCoreStrategy = (key, changes) =>
      patch('coreStrategies', (list) => list.map((s) => (s.key === key ? { ...s, ...changes } : s)));

    const addEntryConfig = (data) => {
      let id;
      setState((s) => {
        id = nextId('EC-', s.entryConfigs, 2);
        return { ...s, entryConfigs: [...s.entryConfigs, { ...data, id, createdAt: nowIso() }] };
      });
      return id;
    };
    const updateEntryConfig = (id, changes) =>
      patch('entryConfigs', (list) => list.map((c) => (c.id === id ? { ...c, ...changes } : c)));
    const deleteEntryConfig = (id) => patch('entryConfigs', (list) => list.filter((c) => c.id !== id));

    /* ---------------- Right Entry records ---------------- */
    const addEntryRecord = (data) => {
      let id;
      setState((s) => {
        id = nextId('RE-', s.entryRecords);
        const rec = { ...data, id, createdAt: nowIso(), updatedAt: nowIso() };
        return { ...s, entryRecords: [...s.entryRecords, rec] };
      });
      return id;
    };
    const updateEntryRecord = (id, changes) =>
      patch('entryRecords', (list) =>
        list.map((r) => (r.id === id ? { ...r, ...changes, updatedAt: nowIso() } : r))
      );
    // Simple Entry Check: one completed entry per user per match. The entry
    // amount (demo money) is taken from the user's wallet.
    const completeEntry = (userId, matchId) => {
      const s = stateRef.current;
      const match = s.matches.find((m) => m.id === matchId);
      if (!match) return { ok: false, error: 'Match not found.' };
      if (!['Upcoming', 'In Progress'].includes(match.status)) return { ok: false, error: 'Entry is closed for this match.' };
      if (s.entryRecords.some((r) => r.userId === userId && r.matchId === matchId && r.kind === 'simple')) {
        return { ok: false, error: 'You have already completed the entry for this match.' };
      }
      const amount = Number(match.entryAmount) || 0;
      const balance = walletSummary(s.transactions.filter((t) => t.userId === userId)).balance;
      if (amount > balance) return { ok: false, error: 'Not enough money in your wallet.', needMoney: true };
      const id = nextId('RE-', s.entryRecords);
      const now = nowIso();
      const title = `${match.teamA.short} vs ${match.teamB.short}`;
      setState((st) => ({
        ...st,
        entryRecords: [
          ...st.entryRecords,
          {
            id,
            kind: 'simple',
            userId,
            matchId,
            configId: null,
            configName: 'Entry Check',
            team: '',
            entryAt: now,
            score: '',
            wickets: '',
            overs: '',
            oddsRef: '',
            checklist: {},
            evaluation: { results: [], outcome: 'Entry Completed', passedCount: 0, total: 0, score: 100 },
            decision: 'Entry',
            compliance: 'Compliant',
            reason: 'Simple entry check completed.',
            notes: '',
            entryAmount: amount,
            status: 'Completed',
            createdAt: now,
            updatedAt: now,
          },
        ],
        transactions: amount
          ? [
              ...st.transactions,
              { id: nextId('TXN-', st.transactions), userId, type: 'Debit', amount, description: `Entry: ${title}`, status: 'Completed', createdAt: now },
            ]
          : st.transactions,
        notifications: [
          {
            id: `N-entry-${id}`,
            kind: 'system',
            audience: userId,
            type: 'success',
            title: 'Entry completed',
            message: `Your entry for ${title} is complete${amount ? ` (${formatAmount(amount)} demo money)` : ''}.`,
            link: '/user/strategies/right-entry',
            published: true,
            readBy: [],
            createdAt: now,
          },
          ...st.notifications,
        ],
      }));
      return { ok: true, id, amount };
    };
    const deleteEntryRecord = (id) => patch('entryRecords', (list) => list.filter((r) => r.id !== id));

    /* ---------------- Match updates ---------------- */
    const addMatchUpdate = (data) => {
      setState((s) => {
        const upd = { ...data, id: nextId('UPD-', s.matchUpdates) };
        const matches = s.matches.map((m) =>
          m.id === data.matchId && data.status && m.status !== data.status ? { ...m, status: data.status } : m
        );
        return { ...s, matchUpdates: [...s.matchUpdates, upd], matches };
      });
    };
    const updateMatchUpdate = (id, changes) =>
      patch('matchUpdates', (list) => list.map((u) => (u.id === id ? { ...u, ...changes } : u)));
    const deleteMatchUpdate = (id) => patch('matchUpdates', (list) => list.filter((u) => u.id !== id));

    /* ---------------- Risk settings ---------------- */
    const updateRiskSettings = (userId, changes) =>
      setState((s) => ({
        ...s,
        riskSettings: {
          ...s.riskSettings,
          [userId]: { ...s.defaultRisk, ...(s.riskSettings[userId] || {}), ...changes },
        },
      }));
    const updateDefaultRisk = (changes) => patch('defaultRisk', (d) => ({ ...d, ...changes }));
    const addRiskReview = (userId, alertId, note) =>
      setState((s) => ({
        ...s,
        riskReviews: {
          ...s.riskReviews,
          [userId]: { ...(s.riskReviews[userId] || {}), [alertId]: { note, at: nowIso() } },
        },
      }));

    /* ---------------- P&L records (with risk checks) ---------------- */
    // After any P&L change we re-run the risk evaluation for that user and
    // raise a notification for every newly created warning.
    const withRiskCheck = (s, userId, nextPnl) => {
      const settings = { ...s.defaultRisk, ...(s.riskSettings[userId] || {}) };
      const reviews = s.riskReviews[userId] || {};
      const before = evaluateRisk(s.pnlRecords.filter((r) => r.userId === userId), settings, reviews);
      const after = evaluateRisk(nextPnl.filter((r) => r.userId === userId), settings, reviews);
      const known = new Map(before.alerts.map((a) => [a.id, a.level]));
      const fresh = after.alerts.filter((a) => known.get(a.id) !== a.level);
      const notes = fresh
        .filter((a) =>
          a.level === RISK_STATUS.OVER ? settings.warnOnExceed !== false : settings.warnOnApproach !== false
        )
        .map((a, i) => ({
          id: `N-risk-${Date.now().toString(36)}-${i}`,
          kind: 'system',
          audience: userId,
          type: a.level === RISK_STATUS.OVER ? 'danger' : 'warning',
          title: a.level === RISK_STATUS.OVER ? `${a.scope} exceeded (demo)` : `Approaching ${a.scope.toLowerCase()}`,
          message: a.isCount
            ? `${a.amount} records recorded this session; limit is ${a.limit}.`
            : `Recorded demo loss ${formatAmount(a.amount)} vs limit ${formatAmount(a.limit)}${a.recordId ? ` (record ${a.recordId})` : ''}.`,
          link: '/user/strategies/loss-cut',
          published: true,
          readBy: [],
          createdAt: nowIso(),
        }));
      return { notifications: [...notes, ...s.notifications], newAlerts: fresh };
    };

    const addPnlRecord = (data) => {
      let result = {};
      setState((s) => {
        const id = nextId('PL-', s.pnlRecords);
        const rec = { ...data, id, createdAt: nowIso() };
        const nextPnl = [...s.pnlRecords, rec];
        const { notifications, newAlerts } = withRiskCheck(s, data.userId, nextPnl);
        result = { id, newAlerts };
        const entryRecords =
          data.recordId && rec.status === 'Completed'
            ? s.entryRecords.map((r) => (r.id === data.recordId ? { ...r, status: 'Completed', updatedAt: nowIso() } : r))
            : s.entryRecords;
        return { ...s, pnlRecords: nextPnl, notifications, entryRecords };
      });
      return result;
    };
    const updatePnlRecord = (id, changes) => {
      let result = {};
      setState((s) => {
        const existing = s.pnlRecords.find((r) => r.id === id);
        if (!existing) return s;
        const nextPnl = s.pnlRecords.map((r) => (r.id === id ? { ...r, ...changes } : r));
        const { notifications, newAlerts } = withRiskCheck(s, existing.userId, nextPnl);
        result = { id, newAlerts };
        return { ...s, pnlRecords: nextPnl, notifications };
      });
      return result;
    };
    const deletePnlRecord = (id) => patch('pnlRecords', (list) => list.filter((r) => r.id !== id));

    /* ---------------- Wallet ---------------- */
    const addTransaction = (data) => {
      let id;
      setState((s) => {
        id = nextId('TXN-', s.transactions);
        return { ...s, transactions: [...s.transactions, { ...data, id, createdAt: nowIso() }] };
      });
      return id;
    };
    const updateTransaction = (id, changes) =>
      patch('transactions', (list) => list.map((t) => (t.id === id ? { ...t, ...changes } : t)));

    /* ---------------- KYC ---------------- */
    const submitKyc = (userId, data) => {
      setState((s) => {
        const existing = s.kycRecords.find((k) => k.userId === userId);
        const user = s.users.find((u) => u.id === userId);
        const record = {
          id: existing?.id || nextId('KYC-', s.kycRecords, 2),
          userId,
          reference: existing?.reference || `KYC-DEMO-${Math.floor(1000 + Math.random() * 9000)}`,
          ...data,
          status: 'Pending Review',
          submittedAt: nowIso(),
          updatedAt: nowIso(),
          remarks: '',
        };
        const kycRecords = existing
          ? s.kycRecords.map((k) => (k.userId === userId ? record : k))
          : [...s.kycRecords, record];
        const notifications = [
          {
            id: `N-kyc-${Date.now().toString(36)}`,
            kind: 'system',
            audience: 'admins',
            type: 'info',
            title: 'New demo KYC request',
            message: `${user?.name || userId} submitted a demo KYC request (${record.reference}).`,
            link: '/admin/kyc',
            published: true,
            readBy: [],
            createdAt: nowIso(),
          },
          ...s.notifications,
        ];
        return { ...s, kycRecords, notifications };
      });
    };
    const updateKyc = (id, changes) => {
      setState((s) => {
        const rec = s.kycRecords.find((k) => k.id === id);
        if (!rec) return s;
        const updated = { ...rec, ...changes, updatedAt: nowIso() };
        const notifications =
          changes.status && changes.status !== rec.status
            ? [
                {
                  id: `N-kycu-${Date.now().toString(36)}`,
                  kind: 'system',
                  audience: rec.userId,
                  type: changes.status.startsWith('Approved')
                    ? 'success'
                    : changes.status.startsWith('Rejected')
                      ? 'danger'
                      : 'info',
                  title: `Demo KYC: ${changes.status}`,
                  message: changes.remarks
                    ? `Admin remarks: ${changes.remarks}`
                    : 'Your simulated KYC status was updated by the admin.',
                  link: '/user/kyc',
                  published: true,
                  readBy: [],
                  createdAt: nowIso(),
                },
                ...s.notifications,
              ]
            : s.notifications;
        return { ...s, kycRecords: s.kycRecords.map((k) => (k.id === id ? updated : k)), notifications };
      });
    };

    /* ---------------- Claims ---------------- */
    const submitClaim = (userId, data) => {
      let id;
      setState((s) => {
        const year = new Date().getFullYear();
        id = nextId(`CLM-${year}-`, s.claims);
        const user = s.users.find((u) => u.id === userId);
        const claim = {
          id,
          userId,
          ...data,
          status: 'Submitted',
          message: s.settings.claimDefaultMessage,
          processingTime: s.settings.claimProcessingTime,
          internalNotes: '',
          submittedAt: nowIso(),
          updatedAt: nowIso(),
          history: [{ status: 'Submitted', at: nowIso(), note: 'Claim submitted by user.' }],
        };
        const notifications = [
          {
            id: `N-clm-${Date.now().toString(36)}`,
            kind: 'system',
            audience: userId,
            type: 'info',
            title: `Claim ${id} submitted`,
            message: s.settings.claimDefaultMessage,
            link: '/user/claims/history',
            published: true,
            readBy: [],
            createdAt: nowIso(),
          },
          {
            id: `N-clma-${Date.now().toString(36)}`,
            kind: 'system',
            audience: 'admins',
            type: 'info',
            title: 'New demo claim request',
            message: `${user?.name || userId} submitted ${id} for ${formatAmount(data.amount)} (simulated).`,
            link: '/admin/claims',
            published: true,
            readBy: [],
            createdAt: nowIso(),
          },
          ...s.notifications,
        ];
        return { ...s, claims: [...s.claims, claim], notifications };
      });
      return id;
    };
    const updateClaim = (id, changes, note = '') => {
      setState((s) => {
        const claim = s.claims.find((c) => c.id === id);
        if (!claim) return s;
        const statusChanged = changes.status && changes.status !== claim.status;
        const messageChanged = changes.message !== undefined && changes.message !== claim.message;
        const timeChanged = changes.processingTime !== undefined && changes.processingTime !== claim.processingTime;
        const history = statusChanged
          ? [...claim.history, { status: changes.status, at: nowIso(), note }]
          : claim.history;
        const updated = { ...claim, ...changes, history, updatedAt: nowIso() };
        const notifications =
          statusChanged || messageChanged || timeChanged
            ? [
                {
                  id: `N-clmu-${Date.now().toString(36)}`,
                  kind: 'system',
                  audience: claim.userId,
                  type: (updated.status || '').startsWith('Rejected')
                    ? 'danger'
                    : (updated.status || '').startsWith('Completed') || (updated.status || '').startsWith('Approved')
                      ? 'success'
                      : 'info',
                  title: statusChanged ? `Claim ${id}: ${updated.status}` : `Claim ${id} updated`,
                  message: updated.message,
                  link: '/user/claims/history',
                  published: true,
                  readBy: [],
                  createdAt: nowIso(),
                },
                ...s.notifications,
              ]
            : s.notifications;
        return { ...s, claims: s.claims.map((c) => (c.id === id ? updated : c)), notifications };
      });
    };

    /* ---------------- Notifications ---------------- */
    const addNotification = (data) =>
      setState((s) => ({
        ...s,
        notifications: [
          { kind: 'announcement', readBy: [], createdAt: nowIso(), ...data, id: nextId('N-', s.notifications, 3) },
          ...s.notifications,
        ],
      }));
    const updateNotification = (id, changes) =>
      patch('notifications', (list) => list.map((n) => (n.id === id ? { ...n, ...changes } : n)));
    const deleteNotification = (id) => patch('notifications', (list) => list.filter((n) => n.id !== id));
    const markRead = (userId, id) =>
      patch('notifications', (list) =>
        list.map((n) => (n.id === id && !n.readBy.includes(userId) ? { ...n, readBy: [...n.readBy, userId] } : n))
      );
    const markAllRead = (userId, ids) =>
      patch('notifications', (list) =>
        list.map((n) => (ids.includes(n.id) && !n.readBy.includes(userId) ? { ...n, readBy: [...n.readBy, userId] } : n))
      );

    /* ---------------- Settings ---------------- */
    const updateSettings = (changes) => patch('settings', (s) => ({ ...s, ...changes }));
    const resetDemo = () => setState(initialState());

    return {
      addUser,
      updateUser,
      addMatch,
      updateMatch,
      deleteMatch,
      updateCoreStrategy,
      addEntryConfig,
      updateEntryConfig,
      deleteEntryConfig,
      addEntryRecord,
      updateEntryRecord,
      deleteEntryRecord,
      completeEntry,
      addMatchUpdate,
      updateMatchUpdate,
      deleteMatchUpdate,
      updateRiskSettings,
      updateDefaultRisk,
      addRiskReview,
      addPnlRecord,
      updatePnlRecord,
      deletePnlRecord,
      addTransaction,
      updateTransaction,
      submitKyc,
      updateKyc,
      submitClaim,
      updateClaim,
      addNotification,
      updateNotification,
      deleteNotification,
      markRead,
      markAllRead,
      updateSettings,
      resetDemo,
      pushNotification,
    };
  }, [patch, pushNotification, setState]);

  /* ---------------- Selectors ---------------- */
  const selectors = useMemo(() => {
    const getRiskSettings = (userId) => ({ ...state.defaultRisk, ...(state.riskSettings[userId] || {}) });
    const getRisk = (userId) =>
      evaluateRisk(
        state.pnlRecords.filter((r) => r.userId === userId),
        getRiskSettings(userId),
        state.riskReviews[userId] || {}
      );
    const getKyc = (userId) => state.kycRecords.find((k) => k.userId === userId) || null;
    const kycStatus = (userId) => getKyc(userId)?.status || 'Not Submitted';
    const matchById = (id) => state.matches.find((m) => m.id === id);
    const userById = (id) => state.users.find((u) => u.id === id);
    const notificationsFor = (user) => {
      if (!user) return [];
      return state.notifications
        .filter((n) => n.published)
        .filter((n) => {
          if (n.audience === 'all') return true;
          if (n.audience === 'users') return user.role === 'user';
          if (n.audience === 'admins') return user.role === 'admin';
          return n.audience === user.id;
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    };
    const isStrategyEnabled = (key) => state.coreStrategies.find((s) => s.key === key)?.enabled !== false;
    return { getRiskSettings, getRisk, getKyc, kycStatus, matchById, userById, notificationsFor, isStrategyEnabled };
  }, [state]);

  const value = useMemo(() => ({ ...state, ...actions, ...selectors }), [state, actions, selectors]);
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used inside AppDataProvider');
  return ctx;
}
