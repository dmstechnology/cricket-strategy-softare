import { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Calculator, CheckCircle2, Download, Edit3, Scale, Trash2, Wallet } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import {
  Button, Card, CardHeader, ConfirmDialog, DataTable, EmptyState, Field, Input, Money, PageHeader, Select, StatCard,
  StatusBadge, Tabs, useToast,
} from '../../components/ui';
import PnlForm, { blankPnl } from '../../components/forms/PnlForm';
import { downloadCsv, matchTitle, periodSummaries, summarizePnl, PNL_METHODS } from '../../utils/calculations';
import { STRATEGY_LABELS } from '../../utils/analytics';
import { formatAmount, formatDateTime, shortDate, toDateKey, toDateTimeInput } from '../../utils/formatters';

const EMPTY = { matchId: '', strategy: '', from: '', to: '', status: '' };

export default function PnlPage() {
  const data = useAppData();
  const { user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('calculator');
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [f, setF] = useState(EMPTY);
  const [period, setPeriod] = useState('day');
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const mine = data.pnlRecords.filter((r) => r.userId === user.id);
  const strategyOf = (r) => (r.source === 'book-profit' ? 'book-profit' : r.strategyKey);

  const filtered = useMemo(
    () =>
      mine
        .filter((r) => !f.matchId || r.matchId === f.matchId)
        .filter((r) => !f.strategy || strategyOf(r) === f.strategy)
        .filter((r) => !f.status || r.status === f.status)
        .filter((r) => {
          const k = toDateKey(r.exitAt || r.createdAt);
          return (!f.from || k >= f.from) && (!f.to || k <= f.to);
        }),
    [mine, f]
  );
  const summary = summarizePnl(filtered);
  const periods = periodSummaries(filtered, period);

  const startEdit = (r) => {
    setEditing({
      id: r.id,
      initial: blankPnl({
        ...r,
        costs: r.costs || '',
        exitAt: toDateTimeInput(r.exitAt || r.createdAt),
        entryValue: r.entryValue ?? '',
        exitValue: r.exitValue ?? '',
        positionSize: r.positionSize ?? '',
        recordedGain: r.recordedGain ?? '',
        targetValue: r.targetValue ?? '',
      }),
    });
    setTab('calculator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const exportCsv = () => {
    downloadCsv(
      `demo-pnl-history-${toDateKey(new Date())}.csv`,
      filtered.map((r) => ({
        record_id: r.id,
        entry_record: r.recordId,
        match: `${r.matchId} ${matchTitle(data.matchById(r.matchId))}`,
        strategy: STRATEGY_LABELS[strategyOf(r)],
        method: PNL_METHODS[r.method]?.name,
        entry_value: r.entryValue,
        exit_value: r.exitValue,
        position_size: r.positionSize,
        gross: r.gross,
        costs: r.costs,
        net: r.net,
        target: r.targetValue,
        exit_reason: r.exitReason,
        status: r.status,
        exit_at: r.exitAt,
        note: 'SIMULATED DEMO DATA',
      }))
    );
    toast('CSV downloaded. All values are simulated demo data.', 'info');
  };

  return (
    <>
      <PageHeader
        title="Profit & Loss"
        description="Save the result of a play and see your total profit or loss."
        
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Total profit" value={formatAmount(summary.gains)} icon={ArrowUpRight} tone="green" simulated />
        <StatCard label="Total loss" value={formatAmount(summary.losses)} icon={ArrowDownRight} tone="red" simulated />
        <StatCard label="Overall" value={formatAmount(summary.net, { sign: true })} icon={Wallet} tone={summary.net >= 0 ? 'green' : 'red'} simulated />
        <StatCard label="Average per play" value={summary.average === null ? '—' : formatAmount(summary.average, { sign: true })} icon={Scale} tone="slate" />
        <StatCard label="Finished plays" value={summary.count} icon={CheckCircle2} tone="indigo" hint={`${summary.wins} positive · ${summary.lossesCount} negative · ${summary.flat} zero`} />
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'calculator', label: editing ? `Editing ${editing.id}` : 'Add result' },
          { value: 'history', label: 'History', count: filtered.length },
          { value: 'summaries', label: 'By day / week / month' },
        ]}
        className="mb-6 w-fit max-w-full"
      />

      {tab === 'calculator' && (
        <PnlForm
          key={editing?.id || 'new'}
          userId={user.id}
          initial={editing?.initial}
          editingId={editing?.id}
          onSaved={() => {
            setEditing(null);
            setTab('history');
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      {tab !== 'calculator' && (
        <Card className="mb-6 p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <Field label="Match" className="lg:col-span-2">
              <Select value={f.matchId} onChange={set('matchId')} placeholder="All matches" options={data.matches.map((m) => ({ value: m.id, label: `${m.id} · ${matchTitle(m)}` }))} />
            </Field>
            <Field label="Strategy">
              <Select value={f.strategy} onChange={set('strategy')} placeholder="All" options={['right-entry', 'live-tracking', 'book-profit'].map((k) => ({ value: k, label: STRATEGY_LABELS[k] }))} />
            </Field>
            <Field label="From"><Input type="date" value={f.from} onChange={set('from')} /></Field>
            <Field label="To"><Input type="date" value={f.to} onChange={set('to')} /></Field>
            <Field label="Status">
              <Select value={f.status} onChange={set('status')} placeholder="All" options={['Completed', 'Open']} />
            </Field>
          </div>
        </Card>
      )}

      {tab === 'history' && (
        <Card>
          <CardHeader
            title="Historical results"
            subtitle="Click a row to edit. Open records have no calculated result."
            icon={Calculator}
            action={<Button size="sm" variant="secondary" icon={Download} onClick={exportCsv} disabled={!filtered.length}>Export CSV</Button>}
          />
          <DataTable
            rows={filtered}
            initialSort={{ key: 'exitAt', dir: 'desc' }}
            onRowClick={startEdit}
            empty={<EmptyState title="No records match these filters" />}
            columns={[
              { key: 'id', header: 'ID', render: (r) => <span className="font-mono text-xs">{r.id}</span> },
              { key: 'exitAt', header: 'Exit', render: (r) => formatDateTime(r.exitAt) },
              { key: 'matchId', header: 'Match', render: (r) => matchTitle(data.matchById(r.matchId)) },
              { key: 'strategy', header: 'Strategy', sortValue: strategyOf, render: (r) => STRATEGY_LABELS[strategyOf(r)] },
              { key: 'gross', header: 'Gross', align: 'right', render: (r) => <Money value={r.gross} /> },
              { key: 'costs', header: 'Costs', align: 'right', render: (r) => <span className="tabular-nums text-slate-500">{formatAmount(r.costs)}</span> },
              { key: 'net', header: 'Net', align: 'right', render: (r) => <Money value={r.net} /> },
              { key: 'exitReason', header: 'Exit reason', render: (r) => r.exitReason || '—' },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
              {
                key: 'actions',
                header: '',
                sortable: false,
                render: (r) => (
                  <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button size="xs" variant="ghost" icon={Edit3} onClick={() => startEdit(r)} aria-label="Edit" />
                    <Button size="xs" variant="ghost" icon={Trash2} className="text-red-600 hover:bg-red-50" onClick={() => setToDelete(r)} aria-label="Delete" />
                  </div>
                ),
              },
            ]}
          />
        </Card>
      )}

      {tab === 'summaries' && (
        <Card>
          <CardHeader
            title="Period summaries"
            subtitle="Completed records only"
            icon={Calculator}
            action={<Tabs value={period} onChange={setPeriod} tabs={[{ value: 'day', label: 'Daily' }, { value: 'week', label: 'Weekly' }, { value: 'month', label: 'Monthly' }]} />}
          />
          <DataTable
            rows={periods.map((p) => ({ ...p, id: p.key }))}
            columns={[
              {
                key: 'key',
                header: period === 'day' ? 'Day' : period === 'week' ? 'Week starting' : 'Month',
                render: (p) => (period === 'month' ? new Date(`${p.key}-01T12:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : shortDate(`${p.key}T12:00:00`)),
              },
              { key: 'count', header: 'Records', align: 'right' },
              { key: 'gains', header: 'Gains', align: 'right', render: (p) => <Money value={p.gains} /> },
              { key: 'losses', header: 'Losses', align: 'right', render: (p) => <Money value={p.losses} /> },
              { key: 'net', header: 'Net', align: 'right', render: (p) => <Money value={p.net} /> },
              { key: 'avg', header: 'Average', align: 'right', sortValue: (p) => p.net / p.count, render: (p) => <Money value={p.net / p.count} /> },
            ]}
            empty={<EmptyState title="No completed records in this range" />}
          />
        </Card>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title="Delete P&L record?"
        message={`${toDelete?.id} will be removed from P&L, analytics and risk calculations.`}
        confirmLabel="Delete"
        onConfirm={() => {
          data.deletePnlRecord(toDelete.id);
          toast(`${toDelete.id} deleted.`, 'info');
        }}
      />
    </>
  );
}
