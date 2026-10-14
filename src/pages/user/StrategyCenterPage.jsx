import { Link } from 'react-router-dom';
import { Activity, ArrowRight, BarChart3, Calculator, Crosshair, Lock, ShieldAlert, Target } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { Badge, Card, Money, PageHeader, StatusBadge, cx } from '../../components/ui';
import { ENTRY_OUTCOMES, matchTitle, summarizePnl, targetReached } from '../../utils/calculations';
import { formatAmount, formatPercent, timeAgo } from '../../utils/formatters';

const META = {
  'right-entry': { icon: Crosshair, grad: 'from-indigo-500 to-violet-600' },
  'live-tracking': { icon: Activity, grad: 'from-sky-500 to-blue-600' },
  'book-profit': { icon: Target, grad: 'from-emerald-500 to-teal-600' },
  'loss-cut': { icon: ShieldAlert, grad: 'from-rose-500 to-red-600' },
};

export default function StrategyCenterPage() {
  const data = useAppData();
  const { user } = useAuth();
  const entries = data.entryRecords.filter((r) => r.userId === user.id);
  const updates = data.matchUpdates.filter((u) => u.userId === user.id);
  const pnl = data.pnlRecords.filter((r) => r.userId === user.id);
  const risk = data.getRisk(user.id);
  const settings = data.getRiskSettings(user.id);
  const bp = pnl.filter((r) => r.source === 'book-profit');
  const bpDone = bp.filter((r) => r.status === 'Completed');
  const rule = data.coreStrategies.find((s) => s.key === 'book-profit')?.config?.targetRule || 'net';
  const latest = (list, key) => [...list].sort((a, b) => new Date(b[key]) - new Date(a[key]))[0];

  const stats = {
    'right-entry': {
      count: entries.length,
      recent: latest(entries, 'createdAt'),
      recentText: (r) => `${r.id} · ${matchTitle(data.matchById(r.matchId))} · ${r.decision}`,
      recentAt: (r) => r.createdAt,
      perf: [
        ['Satisfied', entries.filter((r) => r.evaluation.outcome === ENTRY_OUTCOMES.SATISFIED).length],
        ['Compliance', formatPercent(entries.length ? (entries.filter((r) => r.compliance === 'Compliant').length / entries.length) * 100 : null)],
      ],
      risk: `${entries.filter((r) => r.compliance === 'Non-Compliant').length} non-compliant decision(s)`,
    },
    'live-tracking': {
      count: updates.length,
      recent: latest(updates, 'timestamp'),
      recentText: (u) => `${matchTitle(data.matchById(u.matchId))} · ${u.score}/${u.wickets} (${u.overs})`,
      recentAt: (u) => u.timestamp,
      perf: [
        ['Matches tracked', new Set(updates.map((u) => u.matchId)).size],
        ['Linked to records', updates.filter((u) => u.relatedRecordId).length],
      ],
      risk: 'Manual entries only — not verified live data',
    },
    'book-profit': {
      count: bp.length,
      recent: latest(bp, 'exitAt'),
      recentText: (r) => `${r.id} · ${r.exitReason || 'open'}`,
      recentAt: (r) => r.exitAt,
      perf: [
        ['Targets reached', `${bpDone.filter((r) => targetReached(r, rule)).length}/${bpDone.length}`],
        ['Net result', <Money key="n" value={summarizePnl(bp).net} />],
      ],
      risk: 'Results flow into the risk dashboard',
    },
    'loss-cut': {
      count: risk.alerts.length,
      recent: risk.alerts[0],
      recentText: (a) => `${a.scope} · ${a.level}`,
      recentAt: (a) => a.at,
      perf: [
        ['Breaches', risk.breaches.length],
        ['Per-record limit', formatAmount(settings.maxLossPerRecord, { decimals: 0 })],
      ],
      risk: <>Status: <StatusBadge status={risk.status} /></>,
    },
  };

  const pnlSum = summarizePnl(pnl);

  return (
    <>
      <PageHeader
        title="Strategy Center"
        description="The client's four core strategies. Each module records and analyses decisions — none of them execute bets or move money."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        {data.coreStrategies.map((s, i) => {
          const m = META[s.key];
          const Icon = m.icon;
          const st = stats[s.key];
          return (
            <Card key={s.key} className={cx('flex flex-col overflow-hidden', !s.enabled && 'opacity-60')}>
              <div className={cx('flex items-start gap-4 bg-gradient-to-br p-5 text-white', m.grad)}>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                  <Icon className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Strategy {i + 1}</span>
                    {!s.enabled && <span className="inline-flex items-center gap-1 rounded bg-black/20 px-1.5 text-[10px] font-bold uppercase"><Lock className="h-3 w-3" /> Disabled by admin</span>}
                  </div>
                  <h3 className="text-lg font-bold">{s.name}</h3>
                  <p className="text-sm opacity-90">{s.tagline}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-extrabold">{st.count}</p>
                  <p className="text-[11px] opacity-80">records</p>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-4 p-5">
                <p className="text-sm text-slate-600">{s.description}</p>
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Configured rules</p>
                  <ul className="space-y-1">
                    {s.rules.map((r) => (
                      <li key={r} className="flex gap-2 text-sm text-slate-700">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {st.perf.map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
                      <p className="mt-0.5 text-base font-bold text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-1 text-xs text-slate-500">
                  <p>
                    <span className="font-semibold text-slate-700">Recent activity: </span>
                    {st.recent ? `${st.recentText(st.recent)} · ${timeAgo(st.recentAt(st.recent))}` : 'None yet'}
                  </p>
                  <p className="flex flex-wrap items-center gap-1">
                    <span className="font-semibold text-slate-700">Risk information: </span>
                    {st.risk}
                  </p>
                </div>
                <div className="mt-auto">
                  {s.enabled ? (
                    <Link to={s.route} className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800">
                      View Details <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <p className="rounded-lg bg-slate-100 py-2.5 text-center text-sm text-slate-500">Module disabled in the demo interface</p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <h2 className="mb-3 mt-8 text-base font-semibold text-slate-900">Supporting modules</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Link to="/user/pnl" className="card flex items-center gap-4 p-5 transition hover:shadow-md">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Calculator className="h-5 w-5" /></span>
          <div className="flex-1">
            <p className="font-semibold text-slate-900">Profit & Loss Calculator <Badge tone="gray" className="ml-1">Module 3</Badge></p>
            <p className="text-sm text-slate-500">{pnlSum.count} completed records · net <Money value={pnlSum.net} /></p>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-400" />
        </Link>
        <Link to="/user/analytics" className="card flex items-center gap-4 p-5 transition hover:shadow-md">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><BarChart3 className="h-5 w-5" /></span>
          <div className="flex-1">
            <p className="font-semibold text-slate-900">Dashboard & Analytics <Badge tone="gray" className="ml-1">Module 5</Badge></p>
            <p className="text-sm text-slate-500">Charts across all strategies, with filters</p>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-400" />
        </Link>
      </div>
    </>
  );
}
