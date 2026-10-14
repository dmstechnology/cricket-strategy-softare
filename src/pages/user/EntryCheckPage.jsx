import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Clock, Crosshair, Plus, Wallet } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { Alert, Button, Card, EmptyState, Modal, PageHeader, StatusBadge, Tabs, TeamBadge, cx, useToast } from '../../components/ui';
import AddMoneyModal from '../../components/modals/AddMoneyModal';
import { StrategyGate } from '../../routes/guards';
import { matchTitle, walletSummary } from '../../utils/calculations';
import { formatAmount, formatDate, formatDateTime } from '../../utils/formatters';

const entryLabel = (amount) => (Number(amount) > 0 ? formatAmount(Number(amount), { decimals: 0 }) : 'Free');

export default function EntryCheckPage() {
  return (
    <>
      <PageHeader title="Entry Check" description="Pick a match, check the entry amount, and complete your entry." />
      <StrategyGate strategyKey="right-entry">
        <EntryCheckContent />
      </StrategyGate>
    </>
  );
}

function EntryCheckContent() {
  const data = useAppData();
  const { user } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState('open');
  const [selectedId, setSelectedId] = useState(null);
  const [done, setDone] = useState(null); // result after completing
  const [error, setError] = useState('');
  const [addMoney, setAddMoney] = useState(false);

  const myEntries = data.entryRecords.filter((r) => r.userId === user.id && r.kind === 'simple');
  const entered = new Set(myEntries.map((r) => r.matchId));
  const open = data.matches
    .filter((m) => m.status === 'Upcoming' || m.status === 'In Progress')
    .sort((a, b) => (a.status === b.status ? (a.date < b.date ? -1 : 1) : a.status === 'In Progress' ? -1 : 1));
  const balance = walletSummary(data.transactions.filter((t) => t.userId === user.id)).balance;
  const selected = data.matchById(selectedId);
  const amount = Number(selected?.entryAmount) || 0;

  // Opening /entry-check?match=M-1001 jumps straight to that match.
  useEffect(() => {
    const id = params.get('match');
    if (id && open.some((m) => m.id === id) && !entered.has(id)) setSelectedId(id);
  }, []);

  const close = () => {
    setSelectedId(null);
    setDone(null);
    setError('');
    if (params.get('match')) setParams({});
  };

  const complete = () => {
    const res = data.completeEntry(user.id, selectedId);
    if (!res.ok) return setError(res.error);
    setDone(res);
    toast(`Entry completed for ${matchTitle(selected)}.`, 'success', 'Done');
  };

  return (
    <div className="space-y-6">
      {/* How it works */}
      <div className="grid gap-3 sm:grid-cols-3">
        {['Pick a match', 'Check the entry amount', 'Tap Complete Entry'].map((t, i) => (
          <div key={t} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">{i + 1}</span>
            <span className="text-sm font-medium text-slate-700">{t}</span>
          </div>
        ))}
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'open', label: 'Matches', count: open.length },
          { value: 'mine', label: 'My entries', count: myEntries.length },
        ]}
        className="w-fit"
      />

      {tab === 'open' &&
        (open.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {open.map((m) => {
              const isDone = entered.has(m.id);
              return (
                <Card key={m.id} className={cx('flex flex-col p-5', isDone && 'border-emerald-200 bg-emerald-50/40')}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-slate-500">{m.tournament}</span>
                    <StatusBadge status={m.status} />
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-4">
                    <TeamBadge team={m.teamA} />
                    <span className="text-sm font-bold text-slate-400">VS</span>
                    <TeamBadge team={m.teamB} />
                  </div>
                  <p className="mt-2 text-center text-sm font-semibold text-slate-900">
                    {m.teamA.name} vs {m.teamB.name}
                  </p>
                  <p className="mt-1 flex items-center justify-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{formatDate(m.date)}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{m.time}</span>
                  </p>
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <span className="text-sm text-slate-500">Entry</span>
                    <span className="text-lg font-bold text-slate-900">{entryLabel(m.entryAmount)}</span>
                  </div>
                  <div className="mt-4">
                    {isDone ? (
                      <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white">
                        <CheckCircle2 className="h-4 w-4" /> Completed
                      </div>
                    ) : (
                      <Button className="w-full" icon={Crosshair} onClick={() => { setError(''); setSelectedId(m.id); }}>
                        Entry Check
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card><EmptyState icon={CalendarDays} title="No matches open right now" message="New matches will appear here." /></Card>
        ))}

      {tab === 'mine' && (
        <Card>
          {myEntries.length ? (
            <ul className="divide-y divide-slate-100">
              {[...myEntries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((r) => {
                const m = data.matchById(r.matchId);
                return (
                  <li key={r.id} className="flex items-center gap-3 px-5 py-4">
                    <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-500" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">{m ? `${m.teamA.name} vs ${m.teamB.name}` : r.matchId}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(r.createdAt)}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{entryLabel(r.entryAmount)}</span>
                    <StatusBadge status="Completed" />
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState icon={Crosshair} title="No entries yet" message="Pick a match and tap Entry Check." action={<Button variant="secondary" onClick={() => setTab('open')}>See matches</Button>} />
          )}
        </Card>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={close}
        size="sm"
        title={done ? 'Entry completed' : 'Entry Check'}
        footer={
          done ? (
            <Button onClick={close} className="w-full sm:w-auto">Done</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={close}>Cancel</Button>
              <Button icon={CheckCircle2} onClick={complete} disabled={amount > balance}>Complete Entry</Button>
            </>
          )
        }
      >
        {selected && (done ? (
          <div className="flex flex-col items-center py-4 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-9 w-9" />
            </span>
            <p className="mt-4 text-lg font-bold text-slate-900">You're in!</p>
            <p className="mt-1 text-sm text-slate-500">
              Entry for {selected.teamA.name} vs {selected.teamB.name} is complete.
              {done.amount > 0 && ` ${formatAmount(done.amount)} was taken from your wallet.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <TeamBadge team={selected.teamA} />
              <span className="text-sm font-bold text-slate-400">VS</span>
              <TeamBadge team={selected.teamB} />
            </div>
            <p className="text-center font-semibold text-slate-900">{selected.teamA.name} vs {selected.teamB.name}</p>
            <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
              <div className="flex justify-between px-4 py-3"><dt className="text-slate-500">Entry amount</dt><dd className="font-bold text-slate-900">{entryLabel(amount)}</dd></div>
              <div className="flex justify-between px-4 py-3"><dt className="flex items-center gap-1.5 text-slate-500"><Wallet className="h-4 w-4" />Your wallet</dt><dd className="font-semibold text-slate-900">{formatAmount(balance)}</dd></div>
              <div className="flex justify-between px-4 py-3"><dt className="text-slate-500">After entry</dt><dd className={cx('font-semibold', balance - amount < 0 ? 'text-red-600' : 'text-slate-900')}>{formatAmount(balance - amount)}</dd></div>
            </dl>
            {amount > balance && (
              <Alert type="warning" title="Not enough money" action={<Button size="sm" icon={Plus} onClick={() => setAddMoney(true)}>Add Money</Button>}>
                Add money to your wallet to complete this entry.
              </Alert>
            )}
            {error && <Alert type="danger">{error}</Alert>}
            <p className="text-center text-xs text-slate-400">Demo money only — no real payment or betting.</p>
          </div>
        ))}
      </Modal>
      <AddMoneyModal open={addMoney} onClose={() => setAddMoney(false)} />
    </div>
  );
}
