import { useState } from 'react';
import { Download, LineChart, Users } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { Button, Card, CardHeader, DataTable, DemoNotice, Field, Money, PageHeader, Select, StatCard, StatusBadge, useToast } from '../../components/ui';
import { PnlTrendChart, RiskBreachChart, StrategyPerformanceChart } from '../../components/charts/Charts';
import { breachSeries, pnlTrend, strategyPerformance, STRATEGY_LABELS } from '../../utils/analytics';
import { downloadCsv, matchTitle, summarizePnl } from '../../utils/calculations';
import { formatAmount, formatDateTime, toDateKey } from '../../utils/formatters';

export default function PnlReportsPage() {
  const data = useAppData();
  const toast = useToast();
  const [userId, setUserId] = useState('');
  const users = data.users.filter((u) => u.role === 'user');
  const records = data.pnlRecords.filter((r) => !userId || r.userId === userId);
  const sum = summarizePnl(records);
  const alerts = (userId ? [userId] : users.map((u) => u.id)).flatMap((id) => data.getRisk(id).alerts);
  const perUser = users.map((u) => {
    const s = summarizePnl(data.pnlRecords.filter((r) => r.userId === u.id));
    return { id: u.id, name: u.name, ...s, breaches: data.getRisk(u.id).breaches.length };
  });

  const exportCsv = () => {
    downloadCsv(`demo-pnl-report-${toDateKey(new Date())}.csv`, records.map((r) => ({
      id: r.id, user: data.userById(r.userId)?.name, match: matchTitle(data.matchById(r.matchId)), strategy: STRATEGY_LABELS[r.source === 'book-profit' ? 'book-profit' : r.strategyKey],
      gross: r.gross, costs: r.costs, net: r.net, status: r.status, exit_at: r.exitAt, note: 'SIMULATED DEMO DATA',
    })));
    toast('Report exported (simulated data).', 'info');
  };

  return (
    <>
      <PageHeader
        title="P&L Reports"
        description="Strategy-wise results, completed-record summaries, trends and risk breaches across demo users."
        actions={
          <>
            <Select className="w-48" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="All users" options={users.map((u) => ({ value: u.id, label: u.name }))} />
            <Button variant="secondary" icon={Download} onClick={exportCsv}>Export CSV</Button>
          </>
        }
      />
      <DemoNotice className="mb-6">Hypothetical demonstration results — not actual earnings.</DemoNotice>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Completed records" value={sum.count} icon={LineChart} tone="indigo" />
        <StatCard label="Total gains" value={formatAmount(sum.gains)} icon={LineChart} tone="green" simulated />
        <StatCard label="Total losses" value={formatAmount(sum.losses)} icon={LineChart} tone="red" simulated />
        <StatCard label="Net result" value={formatAmount(sum.net, { sign: true })} icon={LineChart} tone={sum.net >= 0 ? 'green' : 'red'} simulated hint={sum.average !== null ? `avg ${formatAmount(sum.average, { sign: true })}` : undefined} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <PnlTrendChart data={pnlTrend(records)} />
        <StrategyPerformanceChart data={strategyPerformance(records)} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader title="Completed-record summary by user" icon={Users} />
          <DataTable
            rows={perUser}
            columns={[
              { key: 'name', header: 'User' },
              { key: 'count', header: 'Completed', align: 'right' },
              { key: 'gains', header: 'Gains', align: 'right', render: (r) => <Money value={r.gains} /> },
              { key: 'losses', header: 'Losses', align: 'right', render: (r) => <Money value={r.losses} /> },
              { key: 'net', header: 'Net', align: 'right', render: (r) => <Money value={r.net} /> },
              { key: 'breaches', header: 'Breaches', align: 'right' },
            ]}
          />
        </Card>
        <div className="xl:col-span-2"><RiskBreachChart data={breachSeries(alerts)} /></div>
      </div>
      <Card className="mt-6">
        <CardHeader title="Historical demo records" icon={LineChart} />
        <DataTable
          rows={records}
          initialSort={{ key: 'exitAt', dir: 'desc' }}
          columns={[
            { key: 'id', header: 'ID', render: (r) => <span className="font-mono text-xs">{r.id}</span> },
            { key: 'userId', header: 'User', render: (r) => data.userById(r.userId)?.name },
            { key: 'exitAt', header: 'Exit', render: (r) => formatDateTime(r.exitAt) },
            { key: 'matchId', header: 'Match', render: (r) => matchTitle(data.matchById(r.matchId)) },
            { key: 'net', header: 'Net', align: 'right', render: (r) => <Money value={r.net} /> },
            { key: 'exitReason', header: 'Exit reason' },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          ]}
        />
      </Card>
    </>
  );
}
