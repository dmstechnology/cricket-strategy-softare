import { useState } from 'react';
import { CheckCircle2, Edit3, Flag, Target, XCircle } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, CardHeader, DataTable, EmptyState, Money, PageHeader, StatCard, StatusBadge } from '../../components/ui';
import PnlForm, { blankPnl } from '../../components/forms/PnlForm';
import { StrategyGate } from '../../routes/guards';
import { TARGET_RULES, matchTitle, targetReached } from '../../utils/calculations';
import { formatAmount, formatDateTime, formatPercent, toDateTimeInput } from '../../utils/formatters';

export default function BookProfitPage() {
  return (
    <>
      <PageHeader
        title="Book Profit"
        description="Set a target, then save how your play ended."
        
      />
      <StrategyGate strategyKey="book-profit">
        <BookProfitContent />
      </StrategyGate>
    </>
  );
}

function BookProfitContent() {
  const data = useAppData();
  const { user } = useAuth();
  const [editing, setEditing] = useState(null);
  const rule = data.coreStrategies.find((s) => s.key === 'book-profit')?.config?.targetRule || 'net';

  const withTargets = data.pnlRecords.filter((r) => r.userId === user.id && r.targetValue !== '' && r.targetValue !== null && r.targetValue !== undefined);
  const completed = withTargets.filter((r) => r.status === 'Completed');
  const reachedCount = completed.filter((r) => targetReached(r, rule)).length;
  const openEntries = data.entryRecords.filter((r) => r.userId === user.id && r.status === 'Open' && r.decision === 'Entry');

  const startEdit = (r) => {
    setEditing({
      id: r.id,
      initial: blankPnl({ ...r, costs: r.costs || '', exitAt: toDateTimeInput(r.exitAt || r.createdAt) }),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Records with targets" value={withTargets.length} icon={Target} tone="indigo" />
        <StatCard label="Targets reached" value={reachedCount} icon={CheckCircle2} tone="green" />
        <StatCard label="Targets not reached" value={completed.length - reachedCount} icon={XCircle} tone="amber" />
        <StatCard label="Hit rate" value={formatPercent(completed.length ? (reachedCount / completed.length) * 100 : null)} icon={Flag} tone="violet" hint={TARGET_RULES[rule]} />
      </div>

      {openEntries.length > 0 && !editing && (
        <Card>
          <CardHeader title="Open entry records awaiting an exit" subtitle="Pick one to pre-fill the form" icon={Flag} />
          <div className="flex flex-wrap gap-2 p-4">
            {openEntries.map((r) => (
              <Button
                key={r.id}
                size="sm"
                variant="soft"
                onClick={() => setEditing({ id: null, initial: blankPnl({ recordId: r.id, matchId: r.matchId }), key: r.id })}
              >
                {r.id} · {matchTitle(data.matchById(r.matchId))}
              </Button>
            ))}
          </div>
        </Card>
      )}

      <PnlForm
        key={editing?.id || editing?.key || 'new'}
        mode="book-profit"
        userId={user.id}
        initial={editing?.initial}
        editingId={editing?.id || undefined}
        onSaved={() => setEditing(null)}
        onCancel={() => setEditing(null)}
      />

      <Card>
        <CardHeader title="Completed-record history" subtitle="Target versus recorded result" icon={Target} />
        <DataTable
          rows={withTargets}
          initialSort={{ key: 'exitAt', dir: 'desc' }}
          onRowClick={startEdit}
          empty={<EmptyState icon={Target} title="No target records yet" message="Record your first exit above." />}
          columns={[
            { key: 'id', header: 'ID', render: (r) => <span className="font-mono text-xs">{r.id}</span> },
            { key: 'recordId', header: 'Entry record', render: (r) => r.recordId || '—' },
            { key: 'matchId', header: 'Match', render: (r) => matchTitle(data.matchById(r.matchId)) },
            { key: 'exitAt', header: 'Exit time', render: (r) => formatDateTime(r.exitAt) },
            { key: 'targetValue', header: 'Target', align: 'right', sortValue: (r) => Number(r.targetValue), render: (r) => formatAmount(Number(r.targetValue)) },
            { key: 'net', header: 'Recorded result', align: 'right', render: (r) => <Money value={r.net} /> },
            {
              key: 'reached',
              header: 'Target',
              sortValue: (r) => targetReached(r, rule),
              render: (r) => {
                const t = targetReached(r, rule);
                return t === null ? <StatusBadge status="Open" /> : <StatusBadge status={t ? 'Target Reached' : 'Target Missed'} />;
              },
            },
            { key: 'exitReason', header: 'Exit reason', render: (r) => r.exitReason || '—' },
            {
              key: 'a',
              header: '',
              sortable: false,
              render: (r) => <Button size="xs" variant="ghost" icon={Edit3} onClick={(e) => { e.stopPropagation(); startEdit(r); }}>Edit</Button>,
            },
          ]}
        />
      </Card>
    </div>
  );
}
