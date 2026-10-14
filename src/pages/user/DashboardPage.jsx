import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BadgeCheck, BarChart3, Bell, Calculator, CalendarDays, Crosshair, FileText, Plus, Radio, ShieldAlert,
  Target, TrendingDown, TrendingUp, Wallet,
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, EmptyState, cx } from '../../components/ui';
import MatchCard from '../../components/cards/MatchCard';
import AddMoneyModal from '../../components/modals/AddMoneyModal';
import { latestUpdateFor, matchTitle, summarizePnl, walletSummary, RISK_STATUS } from '../../utils/calculations';
import { formatAmount, timeAgo } from '../../utils/formatters';

// Plain-language versions of the internal statuses.
const LIMIT_TEXT = {
  [RISK_STATUS.OK]: { label: 'You are safe', hint: 'Losses are within your limit', tone: 'green' },
  [RISK_STATUS.NEAR]: { label: 'Close to your limit', hint: 'Be careful with new plays', tone: 'amber' },
  [RISK_STATUS.OVER]: { label: 'Limit crossed', hint: 'Stop for today', tone: 'red' },
  [RISK_STATUS.REVIEW]: { label: 'Add a note', hint: 'Explain a past limit cross', tone: 'amber' },
};
const ID_TEXT = {
  'Not Submitted': { label: 'Not verified', hint: 'Verify to claim money', tone: 'amber' },
  'Pending Review': { label: 'Waiting', hint: 'Admin is checking', tone: 'blue' },
  'Approved (Simulated)': { label: 'Verified', hint: 'You can claim money', tone: 'green' },
  'Rejected (Simulated)': { label: 'Not accepted', hint: 'Please try again', tone: 'red' },
};
const TONE = {
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  blue: 'bg-blue-50 text-blue-700',
  indigo: 'bg-indigo-50 text-indigo-700',
};

const ACTIONS = [
  { label: 'Entry Check', hint: 'Pick a match and join', to: '/user/strategies/right-entry', icon: Crosshair, color: 'bg-indigo-600', key: 'right-entry' },
  { label: 'Match Notes', hint: 'Write down the score as it goes', to: '/user/strategies/live-tracking', icon: Radio, color: 'bg-sky-600', key: 'live-tracking' },
  { label: 'Book Profit', hint: 'Save how your play ended', to: '/user/strategies/book-profit', icon: Target, color: 'bg-emerald-600', key: 'book-profit' },
  { label: 'Profit & Loss', hint: 'See what you won or lost', to: '/user/pnl', icon: Calculator, color: 'bg-amber-500' },
  { label: 'Loss Limit', hint: 'Set how much loss is too much', to: '/user/strategies/loss-cut', icon: ShieldAlert, color: 'bg-rose-600', key: 'loss-cut' },
  { label: 'Reports', hint: 'Simple charts of your progress', to: '/user/analytics', icon: BarChart3, color: 'bg-violet-600' },
];

function SummaryCard({ icon: Icon, title, value, hint, tone, to, action }) {
  const inner = (
    <Card className="flex h-full flex-col p-5 transition hover:shadow-md">
      <div className="flex items-center gap-3">
        <span className={cx('flex h-10 w-10 items-center justify-center rounded-xl', TONE[tone])}>
          <Icon className="h-5 w-5" />
        </span>
        <p className="text-sm font-medium text-slate-500">{title}</p>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{hint}</p>
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
  return to ? <Link to={to} className="block h-full">{inner}</Link> : inner;
}

export default function DashboardPage() {
  const data = useAppData();
  const { user } = useAuth();
  const [addOpen, setAddOpen] = useState(false);

  const wallet = walletSummary(data.transactions.filter((t) => t.userId === user.id));
  const myPnl = data.pnlRecords.filter((r) => r.userId === user.id);
  const pnl = summarizePnl(myPnl);
  const risk = data.getRisk(user.id);
  const limit = LIMIT_TEXT[risk.status];
  const id = ID_TEXT[data.kycStatus(user.id)] || ID_TEXT['Not Submitted'];

  const matches = data.matches
    .filter((m) => m.status === 'In Progress' || m.status === 'Upcoming')
    .sort((a, b) => (a.status === b.status ? (a.date < b.date ? -1 : 1) : a.status === 'In Progress' ? -1 : 1))
    .slice(0, 3);

  // A single, plain-language activity feed.
  const activity = [
    ...data.entryRecords.filter((r) => r.userId === user.id).map((r) => ({
      id: r.id,
      at: r.createdAt,
      icon: Crosshair,
      text: r.kind === 'simple'
        ? `Entry completed for ${matchTitle(data.matchById(r.matchId))}${r.entryAmount ? ` (${formatAmount(r.entryAmount, { decimals: 0 })})` : ''}`
        : `Entry check for ${matchTitle(data.matchById(r.matchId))} — ${r.evaluation.outcome === 'Conditions Satisfied' ? 'all rules OK' : r.evaluation.outcome === 'Conditions Not Satisfied' ? 'rules not met' : 'needs review'}`,
      tone: r.kind === 'simple' ? 'text-emerald-600' : undefined,
    })),
    ...myPnl.filter((r) => r.status === 'Completed').map((r) => ({
      id: r.id,
      at: r.exitAt || r.createdAt,
      icon: r.net >= 0 ? TrendingUp : TrendingDown,
      text: `${r.net >= 0 ? 'Profit' : 'Loss'} of ${formatAmount(Math.abs(r.net))} on ${matchTitle(data.matchById(r.matchId))}`,
      tone: r.net >= 0 ? 'text-emerald-600' : 'text-red-600',
    })),
    ...data.claims.filter((c) => c.userId === user.id).map((c) => ({
      id: c.id,
      at: c.updatedAt,
      icon: FileText,
      text: `Claim of ${formatAmount(c.amount)} — ${c.status.replace(' (Simulated)', '')}`,
    })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 6);

  const messages = data.notificationsFor(user).slice(0, 4);
  const openClaims = data.claims
    .filter((c) => c.userId === user.id && !['Completed (Simulated)', 'Rejected (Simulated)'].includes(c.status))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  const actions = ACTIONS.filter((a) => !a.key || data.isStrategyEnabled(a.key));

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hi, {user.name.split(' ')[0]}</h1>
        <p className="mt-1 text-sm text-slate-500">Here is your summary. All money shown is demo money for practice.</p>
      </div>

      {/* 1. Four simple summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Wallet}
          title="Wallet"
          value={formatAmount(wallet.balance)}
          hint="Demo balance"
          tone="indigo"
          action={<Button size="sm" icon={Plus} onClick={() => setAddOpen(true)} className="w-full">Add Money</Button>}
        />
        <SummaryCard
          icon={pnl.net >= 0 ? TrendingUp : TrendingDown}
          title="Total Profit / Loss"
          value={<span className={pnl.net >= 0 ? 'text-emerald-600' : 'text-red-600'}>{formatAmount(pnl.net, { sign: true })}</span>}
          hint={`From ${pnl.count} finished plays`}
          tone={pnl.net >= 0 ? 'green' : 'red'}
          to="/user/pnl"
        />
        <SummaryCard icon={ShieldAlert} title="Loss Limit" value={limit.label} hint={limit.hint} tone={limit.tone} to="/user/strategies/loss-cut" />
        <SummaryCard icon={BadgeCheck} title="ID Verification" value={id.label} hint={id.hint} tone={id.tone} to="/user/kyc" />
      </div>

      {/* Open claims: show the admin's latest message right on Home */}
      {openClaims.map((c) => (
        <Link key={c.id} to="/user/claims/history" className="mt-4 flex items-start gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 transition hover:bg-indigo-100/60">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">
              Your claim of {formatAmount(c.amount)} is <span className="text-indigo-700">{c.status.replace(' (Simulated)', '')}</span>
              <span className="font-normal text-slate-500"> · about {c.processingTime}</span>
            </p>
            <p className="mt-0.5 text-sm text-slate-600">{c.message}</p>
          </div>
          <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
        </Link>
      ))}

      {/* 2. What do you want to do? */}
      <h2 className="mb-3 mt-8 text-lg font-semibold text-slate-900">What do you want to do?</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {actions.map(({ label, hint, to, icon: Icon, color }) => (
          <Link key={label} to={to} className="card group flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-md">
            <span className={cx('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm', color)}>
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-slate-900">{label}</span>
              <span className="hidden text-sm text-slate-500 sm:block">{hint}</span>
            </span>
          </Link>
        ))}
      </div>

      {/* 3. Matches */}
      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Live & next matches</h2>
        <Link to="/user/matches" className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
          All matches <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      {matches.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} latest={latestUpdateFor(m.id, data.matchUpdates)} to={`/user/matches/${m.id}`} />
          ))}
        </div>
      ) : (
        <Card><EmptyState icon={CalendarDays} title="No matches right now" message="New matches will show here." /></Card>
      )}

      {/* 4. Activity + messages */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="font-semibold text-slate-900">Your recent activity</h3>
          </div>
          {activity.length ? (
            <ul className="divide-y divide-slate-100">
              {activity.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <a.icon className={cx('h-5 w-5 shrink-0', a.tone || 'text-slate-400')} />
                  <p className="min-w-0 flex-1 text-sm text-slate-700">{a.text}</p>
                  <span className="whitespace-nowrap text-xs text-slate-400">{timeAgo(a.at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nothing yet" message="Start with an Entry Check." className="py-8" />
          )}
        </Card>
        <Card>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 className="font-semibold text-slate-900">Latest messages</h3>
            <Link to="/user/notifications" className="text-sm font-medium text-indigo-600">See all</Link>
          </div>
          {messages.length ? (
            <ul className="divide-y divide-slate-100">
              {messages.map((n) => (
                <li key={n.id} className="flex gap-3 px-5 py-3">
                  <Bell className={cx('mt-0.5 h-5 w-5 shrink-0', { danger: 'text-red-500', warning: 'text-amber-500', success: 'text-emerald-500' }[n.type] || 'text-blue-500')} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">{n.title}</p>
                    <p className="line-clamp-2 text-sm text-slate-500">{n.message}</p>
                  </div>
                  <span className="whitespace-nowrap text-xs text-slate-400">{timeAgo(n.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No messages" className="py-8" />
          )}
        </Card>
      </div>

      <p className="mt-8 text-center text-xs text-slate-400">Demo only — no real money, betting or payments.</p>
      <AddMoneyModal open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}
