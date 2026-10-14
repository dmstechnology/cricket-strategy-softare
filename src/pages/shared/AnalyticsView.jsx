import { useMemo, useState } from 'react';
import {
  Trophy, ClipboardList, Crosshair, CheckCircle2, ListChecks, Percent, Wallet, Calculator, ShieldAlert, FileText, RotateCcw,
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { Button, Card, DemoNotice, Field, Input, Select, StatCard } from '../../components/ui';
import {
  CompletionChart, ComplianceChart, MatchActivityChart, PnlTrendChart, RiskBreachChart, StrategyPerformanceChart,
} from '../../components/charts/Charts';
import { buildAnalytics, STRATEGY_LABELS } from '../../utils/analytics';
import { matchTitle } from '../../utils/calculations';
import { formatAmount, formatPercent, toDateKey } from '../../utils/formatters';

const EMPTY_FILTERS = { from: '', to: '', matchId: '', strategy: '', status: '' };

/**
 * Analytics for one user (userId) or for everyone (userId omitted — admin view).
 */
export default function AnalyticsView({ userId }) {
  const data = useAppData();
  const [f, setF] = useState(EMPTY_FILTERS);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const scoped = useMemo(() => {
    const mine = (r) => !userId || r.userId === userId;
    const inRange = (iso) => {
      const k = toDateKey(iso);
      return (!f.from || k >= f.from) && (!f.to || k <= f.to);
    };
    const strategyOf = (r) => (r.source === 'book-profit' ? 'book-profit' : r.strategyKey);

    let pnl = data.pnlRecords.filter((r) => mine(r) && inRange(r.exitAt || r.createdAt));
    let entries = data.entryRecords.filter((r) => mine(r) && inRange(r.createdAt));
    let updates = data.matchUpdates.filter((u) => (!userId || u.userId === userId) && inRange(u.timestamp));

    if (f.matchId) {
      pnl = pnl.filter((r) => r.matchId === f.matchId);
      entries = entries.filter((r) => r.matchId === f.matchId);
      updates = updates.filter((u) => u.matchId === f.matchId);
    }
    if (f.strategy) {
      pnl = pnl.filter((r) => strategyOf(r) === f.strategy);
      // Entry records belong to Right Entry; manual updates belong to Live Tracking.
      if (f.strategy !== 'right-entry') entries = [];
      if (f.strategy !== 'live-tracking') updates = [];
    }
    if (f.status) {
      pnl = pnl.filter((r) => (f.status === 'Completed' ? r.status === 'Completed' : r.status !== 'Completed'));
      entries = entries.filter((r) => (f.status === 'Completed' ? r.status === 'Completed' : r.status !== 'Completed'));
    }

    // Risk alerts are evaluated per user against that user's own limits.
    const userIds = userId ? [userId] : data.users.filter((u) => u.role === 'user').map((u) => u.id);
    const alerts = userIds
      .flatMap((id) => data.getRisk(id).alerts)
      .filter((a) => inRange(a.at) && (!f.matchId || a.matchId === f.matchId || (a.relatedIds || []).some((rid) => pnl.some((p) => p.id === rid))));

    return { pnl, entries, updates, alerts };
  }, [data, userId, f]);

  const a = useMemo(
    () => buildAnalytics({ pnlRecords: scoped.pnl, entryRecords: scoped.entries, matchUpdates: scoped.updates, alerts: scoped.alerts }),
    [scoped]
  );

  const pendingClaims = data.claims.filter(
    (c) => (!userId || c.userId === userId) && ['Submitted', 'Under Review', 'Processing', 'Approved (Simulated)'].includes(c.status)
  ).length;

  const hasFilters = Object.values(f).some(Boolean);

  return (
    <div className="space-y-6">
      <DemoNotice title="Simulated analytics">
        All figures are calculated from demonstration records in this browser session. Historical demo results are not
        actual earnings and never indicate or guarantee future performance.
      </DemoNotice>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Field label="From">
            <Input type="date" value={f.from} onChange={set('from')} />
          </Field>
          <Field label="To">
            <Input type="date" value={f.to} onChange={set('to')} />
          </Field>
          <Field label="Match">
            <Select value={f.matchId} onChange={set('matchId')} placeholder="All matches" options={data.matches.map((m) => ({ value: m.id, label: `${m.id} · ${matchTitle(m)}` }))} />
          </Field>
          <Field label="Strategy">
            <Select value={f.strategy} onChange={set('strategy')} placeholder="All strategies" options={Object.entries(STRATEGY_LABELS).filter(([k]) => k !== 'loss-cut').map(([value, label]) => ({ value, label }))} />
          </Field>
          <Field label="Record status">
            <Select value={f.status} onChange={set('status')} placeholder="All statuses" options={['Completed', 'Open']} />
          </Field>
          <div className="flex items-end">
            <Button variant="secondary" icon={RotateCcw} className="w-full" disabled={!hasFilters} onClick={() => setF(EMPTY_FILTERS)}>
              Reset filters
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Matches tracked" value={a.matchesTracked} icon={Trophy} tone="blue" />
        <StatCard label="Strategy records" value={scoped.entries.length + scoped.pnl.length} icon={ClipboardList} tone="indigo" hint="Entry + P&L records" />
        <StatCard label="Right Entry records" value={scoped.entries.length} icon={Crosshair} tone="violet" />
        <StatCard label="Completed records" value={a.completed} icon={CheckCircle2} tone="green" />
        <StatCard label="Conditions satisfied" value={a.compliance.counts.satisfied} icon={ListChecks} tone="green" />
        <StatCard label="Rule compliance rate" value={formatPercent(a.compliance.rate)} icon={Percent} tone="indigo" />
        <StatCard label="Total simulated net" value={formatAmount(a.pnl.net, { sign: true })} icon={Wallet} tone={a.pnl.net >= 0 ? 'green' : 'red'} simulated />
        <StatCard label="Avg per completed record" value={a.pnl.average === null ? '—' : formatAmount(a.pnl.average, { sign: true })} icon={Calculator} tone="slate" simulated />
        <StatCard label="Risk-limit breaches" value={a.breachCount} icon={ShieldAlert} tone="red" />
        <StatCard label="Pending demo claims" value={pendingClaims} icon={FileText} tone="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <PnlTrendChart data={a.trend} />
        <StrategyPerformanceChart data={a.byStrategy} />
        <ComplianceChart counts={a.compliance.counts} complianceRate={a.compliance.rate} />
        <MatchActivityChart data={a.activity} />
        <RiskBreachChart data={a.breaches} />
        <CompletionChart completed={a.completed} incomplete={a.incomplete} />
      </div>
    </div>
  );
}
