import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { Alert, Card, CardHeader, DataTable, EmptyState, Field, Money, PageHeader, Select, StatCard, StatusBadge } from '../../components/ui';
import { RiskBreachChart } from '../../components/charts/Charts';
import { breachSeries } from '../../utils/analytics';
import { RISK_STATUS } from '../../utils/calculations';
import { formatAmount, formatDateTime } from '../../utils/formatters';

export default function RiskManagementPage() {
  const data = useAppData();
  const [userId, setUserId] = useState('');
  const users = data.users.filter((u) => u.role === 'user');
  const rows = users.map((u) => {
    const r = data.getRisk(u.id);
    const s = data.getRiskSettings(u.id);
    return { id: u.id, name: u.name, status: r.status, breaches: r.breaches.length, unreviewed: r.alerts.filter((a) => a.level === RISK_STATUS.OVER && !a.review).length, todayLoss: r.current.todayLoss, sessionLoss: r.current.sessionLoss, perRecord: s.maxLossPerRecord, daily: s.dailyLimitEnabled ? s.dailyLossLimit : null, custom: Boolean(data.riskSettings[u.id]) };
  });
  const alerts = users
    .filter((u) => !userId || u.id === userId)
    .flatMap((u) => data.getRisk(u.id).alerts.map((a) => ({ ...a, id: `${u.id}-${a.id}`, userName: u.name })));

  return (
    <>
      <PageHeader title="Risk Management" description="Monitor each demo user's loss-cut status, limit breaches and review notes." />
      <Alert type="warning" className="mb-6">Risk warnings are informational. They cannot block or reverse any transaction outside this demo.</Alert>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Users within limit" value={rows.filter((r) => r.status === RISK_STATUS.OK).length} icon={ShieldAlert} tone="green" />
        <StatCard label="Approaching limit" value={rows.filter((r) => r.status === RISK_STATUS.NEAR).length} icon={ShieldAlert} tone="amber" />
        <StatCard label="Limit exceeded" value={rows.filter((r) => r.status === RISK_STATUS.OVER).length} icon={ShieldAlert} tone="red" />
        <StatCard label="Review required" value={rows.filter((r) => r.status === RISK_STATUS.REVIEW).length} icon={ShieldAlert} tone="violet" />
      </div>
      <Card className="mt-6">
        <CardHeader title="User risk status" icon={ShieldAlert} />
        <DataTable
          rows={rows}
          columns={[
            { key: 'name', header: 'User' },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            { key: 'breaches', header: 'Breaches', align: 'right' },
            { key: 'unreviewed', header: 'Unreviewed', align: 'right' },
            { key: 'todayLoss', header: "Today's loss", align: 'right', render: (r) => formatAmount(r.todayLoss) },
            { key: 'sessionLoss', header: 'Session loss', align: 'right', render: (r) => formatAmount(r.sessionLoss) },
            { key: 'perRecord', header: 'Per-record limit', align: 'right', render: (r) => formatAmount(r.perRecord) },
            { key: 'daily', header: 'Daily limit', align: 'right', render: (r) => (r.daily ? formatAmount(r.daily) : 'Off') },
            { key: 'custom', header: 'Limits', render: (r) => (r.custom ? 'Custom' : 'Default') },
          ]}
        />
      </Card>
      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-2"><RiskBreachChart data={breachSeries(alerts)} /></div>
        <Card className="xl:col-span-3">
          <CardHeader title="Risk alert history" icon={ShieldAlert} action={<Field className="w-48"><Select value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="All users" options={users.map((u) => ({ value: u.id, label: u.name }))} /></Field>} />
          <DataTable
            rows={alerts}
            pageSize={8}
            initialSort={{ key: 'at', dir: 'desc' }}
            empty={<EmptyState title="No alerts" />}
            columns={[
              { key: 'at', header: 'Date', render: (a) => formatDateTime(a.at) },
              { key: 'userName', header: 'User' },
              { key: 'scope', header: 'Limit' },
              { key: 'level', header: 'Level', render: (a) => <StatusBadge status={a.level} /> },
              { key: 'amount', header: 'Value', align: 'right', render: (a) => (a.isCount ? a.amount : <Money value={-a.amount} />) },
              { key: 'recordId', header: 'Record' },
              { key: 'review', header: 'Review note', sortable: false, render: (a) => <span className="block max-w-[220px] truncate text-xs text-slate-500" title={a.review?.note}>{a.review?.note || '—'}</span> },
            ]}
          />
        </Card>
      </div>
    </>
  );
}
