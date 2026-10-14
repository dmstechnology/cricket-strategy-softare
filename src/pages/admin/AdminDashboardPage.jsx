import { Link } from 'react-router-dom';
import { CalendarDays, CheckCircle2, ClipboardList, Cog, FileText, ShieldAlert, ShieldCheck, Users } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { Card, CardHeader, EmptyState, Money, PageHeader, StatCard, StatusBadge } from '../../components/ui';
import { PnlTrendChart, StrategyPerformanceChart } from '../../components/charts/Charts';
import { pnlTrend, strategyPerformance } from '../../utils/analytics';
import { summarizePnl } from '../../utils/calculations';
import { formatAmount, timeAgo } from '../../utils/formatters';

export default function AdminDashboardPage() {
  const data = useAppData();
  const users = data.users.filter((u) => u.role === 'user');
  const risks = users.map((u) => ({ user: u, risk: data.getRisk(u.id), pnl: summarizePnl(data.pnlRecords.filter((r) => r.userId === u.id)) }));
  const breaches = risks.reduce((s, r) => s + r.risk.breaches.length, 0);
  const pendingKyc = data.kycRecords.filter((k) => k.status === 'Pending Review');
  const pendingClaims = data.claims.filter((c) => c.status === 'Submitted' || c.status === 'Under Review');
  const processing = data.claims.filter((c) => c.status === 'Processing' || c.status === 'Approved (Simulated)');
  const completedClaims = data.claims.filter((c) => c.status === 'Completed (Simulated)');

  return (
    <>
      <PageHeader title="Admin Dashboard" description="Manage demo users, fixtures, strategy configuration, KYC and claims. All data is simulated." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total demo users" value={users.length} icon={Users} tone="indigo" to="/admin/users" hint={`${users.filter((u) => u.status === 'Active').length} active`} />
        <StatCard label="Upcoming matches" value={data.matches.filter((m) => m.status === 'Upcoming').length} icon={CalendarDays} tone="blue" to="/admin/matches" hint={`${data.matches.filter((m) => m.status === 'In Progress').length} in progress`} />
        <StatCard label="Pending demo KYC" value={pendingKyc.length} icon={ShieldCheck} tone="amber" to="/admin/kyc" />
        <StatCard label="Pending demo claims" value={pendingClaims.length} icon={FileText} tone="amber" to="/admin/claims" />
        <StatCard label="Claims processing" value={processing.length} icon={Cog} tone="violet" to="/admin/claims" />
        <StatCard label="Completed demo claims" value={completedClaims.length} icon={CheckCircle2} tone="green" to="/admin/claims" />
        <StatCard label="Strategy records" value={data.entryRecords.length + data.pnlRecords.length} icon={ClipboardList} tone="indigo" to="/admin/strategy-records" hint={`${data.entryRecords.length} entry · ${data.pnlRecords.length} P&L`} />
        <StatCard label="Risk-limit breaches" value={breaches} icon={ShieldAlert} tone="red" to="/admin/risk-management" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <PnlTrendChart data={pnlTrend(data.pnlRecords)} height={240} />
        <StrategyPerformanceChart data={strategyPerformance(data.pnlRecords)} height={240} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="KYC awaiting review" icon={ShieldCheck} action={<Link to="/admin/kyc" className="text-sm font-medium text-indigo-600">Manage</Link>} />
          {pendingKyc.length ? (
            <ul className="divide-y divide-slate-100">
              {pendingKyc.map((k) => (
                <li key={k.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{k.displayName}</p>
                    <p className="text-xs text-slate-500">{k.reference} · {timeAgo(k.submittedAt)}</p>
                  </div>
                  <StatusBadge status={k.status} />
                </li>
              ))}
            </ul>
          ) : <EmptyState title="No pending requests" className="py-8" />}
        </Card>
        <Card>
          <CardHeader title="Claims needing action" icon={FileText} action={<Link to="/admin/claims" className="text-sm font-medium text-indigo-600">Manage</Link>} />
          {pendingClaims.length ? (
            <ul className="divide-y divide-slate-100">
              {pendingClaims.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{c.id}</p>
                    <p className="text-xs text-slate-500">{data.userById(c.userId)?.name} · {formatAmount(c.amount)} (demo)</p>
                  </div>
                  <StatusBadge status={c.status} />
                </li>
              ))}
            </ul>
          ) : <EmptyState title="No claims waiting" className="py-8" />}
        </Card>
        <Card>
          <CardHeader title="User risk overview" icon={ShieldAlert} action={<Link to="/admin/risk-management" className="text-sm font-medium text-indigo-600">Details</Link>} />
          <ul className="divide-y divide-slate-100">
            {risks.map(({ user, risk, pnl }) => (
              <li key={user.id} className="flex items-center justify-between gap-2 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{user.name}</p>
                  <p className="text-xs text-slate-500">{pnl.count} records · <Money value={pnl.count ? pnl.net : null} /></p>
                </div>
                <StatusBadge status={risk.status} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
