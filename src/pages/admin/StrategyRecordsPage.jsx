import { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { Card, DataTable, EmptyState, Field, KeyValue, Modal, Money, PageHeader, Select, StatusBadge, Tabs, Button } from '../../components/ui';
import { ENTRY_OUTCOMES, matchTitle } from '../../utils/calculations';
import { STRATEGY_LABELS } from '../../utils/analytics';
import { formatDateTime } from '../../utils/formatters';

export default function StrategyRecordsPage() {
  const data = useAppData();
  const [tab, setTab] = useState('entry');
  const [f, setF] = useState({ userId: '', matchId: '', outcome: '' });
  const [view, setView] = useState(null);
  const users = data.users.filter((u) => u.role === 'user');

  const entries = data.entryRecords
    .filter((r) => !f.userId || r.userId === f.userId)
    .filter((r) => !f.matchId || r.matchId === f.matchId)
    .filter((r) => !f.outcome || r.evaluation.outcome === f.outcome);
  const pnl = data.pnlRecords.filter((r) => !f.userId || r.userId === f.userId).filter((r) => !f.matchId || r.matchId === f.matchId);
  const userName = (id) => data.userById(id)?.name || id;

  return (
    <>
      <PageHeader title="Strategy Records" description="All Right Entry and P&L records created by demo users." />
      <Card>
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 p-4">
          <Tabs value={tab} onChange={setTab} tabs={[{ value: 'entry', label: 'Right Entry', count: entries.length }, { value: 'pnl', label: 'P&L / Book Profit', count: pnl.length }]} />
          <Field label="User" className="w-48"><Select value={f.userId} onChange={(e) => setF({ ...f, userId: e.target.value })} placeholder="All users" options={users.map((u) => ({ value: u.id, label: u.name }))} /></Field>
          <Field label="Match" className="w-56"><Select value={f.matchId} onChange={(e) => setF({ ...f, matchId: e.target.value })} placeholder="All matches" options={data.matches.map((m) => ({ value: m.id, label: `${m.id} · ${matchTitle(m)}` }))} /></Field>
          {tab === 'entry' && <Field label="Outcome" className="w-56"><Select value={f.outcome} onChange={(e) => setF({ ...f, outcome: e.target.value })} placeholder="All" options={Object.values(ENTRY_OUTCOMES)} /></Field>}
        </div>
        {tab === 'entry' ? (
          <DataTable
            rows={entries}
            initialSort={{ key: 'createdAt', dir: 'desc' }}
            onRowClick={setView}
            empty={<EmptyState icon={ClipboardList} title="No records" />}
            columns={[
              { key: 'id', header: 'ID', render: (r) => <span className="font-mono text-xs">{r.id}</span> },
              { key: 'userId', header: 'User', sortValue: (r) => userName(r.userId), render: (r) => userName(r.userId) },
              { key: 'createdAt', header: 'Created', render: (r) => formatDateTime(r.createdAt) },
              { key: 'matchId', header: 'Match', render: (r) => matchTitle(data.matchById(r.matchId)) },
              { key: 'configName', header: 'Configuration' },
              { key: 'outcome', header: 'Evaluation', sortValue: (r) => r.evaluation.outcome, render: (r) => <StatusBadge status={r.evaluation.outcome} /> },
              { key: 'decision', header: 'Decision', render: (r) => <StatusBadge status={r.decision} /> },
              { key: 'compliance', header: 'Compliance', render: (r) => <StatusBadge status={r.compliance} /> },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            ]}
          />
        ) : (
          <DataTable
            rows={pnl}
            initialSort={{ key: 'exitAt', dir: 'desc' }}
            empty={<EmptyState icon={ClipboardList} title="No records" />}
            columns={[
              { key: 'id', header: 'ID', render: (r) => <span className="font-mono text-xs">{r.id}</span> },
              { key: 'userId', header: 'User', sortValue: (r) => userName(r.userId), render: (r) => userName(r.userId) },
              { key: 'exitAt', header: 'Exit', render: (r) => formatDateTime(r.exitAt) },
              { key: 'matchId', header: 'Match', render: (r) => matchTitle(data.matchById(r.matchId)) },
              { key: 'source', header: 'Strategy', render: (r) => STRATEGY_LABELS[r.source === 'book-profit' ? 'book-profit' : r.strategyKey] },
              { key: 'gross', header: 'Gross', align: 'right', render: (r) => <Money value={r.gross} /> },
              { key: 'net', header: 'Net', align: 'right', render: (r) => <Money value={r.net} /> },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            ]}
          />
        )}
      </Card>

      <Modal open={Boolean(view)} onClose={() => setView(null)} size="lg" title={`Record ${view?.id || ''}`} subtitle={view && `${userName(view.userId)} · ${view.configName}`} footer={<Button variant="secondary" onClick={() => setView(null)}>Close</Button>}>
        {view && (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <KeyValue label="Match">{matchTitle(data.matchById(view.matchId))}</KeyValue>
              <KeyValue label="Score">{view.score === '' ? '—' : `${view.score}/${view.wickets} (${view.overs})`}</KeyValue>
              <KeyValue label="Decision"><StatusBadge status={view.decision} /></KeyValue>
              <KeyValue label="Outcome"><StatusBadge status={view.evaluation.outcome} /></KeyValue>
            </dl>
            <ul className="rounded-xl border border-slate-200 text-sm">
              {view.evaluation.results.map((r) => (
                <li key={r.id} className="flex justify-between border-b border-slate-100 px-3 py-2 last:border-0">
                  <span>{r.label}</span>
                  <span className={r.passed === true ? 'text-emerald-600' : r.passed === false ? 'text-red-600' : 'text-amber-600'}>{r.passed === true ? 'Satisfied' : r.passed === false ? 'Not satisfied' : 'Missing input'}</span>
                </li>
              ))}
            </ul>
            <KeyValue label="Reason">{view.reason || '—'}</KeyValue>
            <KeyValue label="Notes">{view.notes || '—'}</KeyValue>
          </div>
        )}
      </Modal>
    </>
  );
}
