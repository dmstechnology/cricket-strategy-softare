import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Plus, Receipt, Wallet } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import {
  Button, Card, CardHeader, DataTable, DemoNotice, EmptyState, Money, PageHeader, StatCard, StatusBadge, Tabs, cx,
} from '../../components/ui';
import AddMoneyModal from '../../components/modals/AddMoneyModal';
import { walletSummary } from '../../utils/calculations';
import { formatAmount, formatDateTime } from '../../utils/formatters';

export default function WalletPage() {
  const data = useAppData();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const txns = data.transactions.filter((t) => t.userId === user.id);
  const w = walletSummary(txns);
  const rows = txns.filter((t) => filter === 'all' || t.type === filter || t.status === filter);

  return (
    <>
      <PageHeader
        title="Wallet"
        description="Your demo money. Add money any time."
        actions={<Button icon={Plus} onClick={() => setOpen(true)}>Add Money</Button>}
      />
      <DemoNotice title="DEMO WALLET" className="mb-6">
        All balances and transactions are simulated. No real money is accepted, stored, or transferred.
      </DemoNotice>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-900 via-indigo-900 to-violet-900 p-6 text-white shadow-card lg:col-span-2">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-16 right-16 h-40 w-40 rounded-full bg-white/5" />
          <div className="relative flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-indigo-200"><Wallet className="h-4 w-4" /> Your balance</span>
            <span className="rounded bg-amber-400/90 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-950">Demo only</span>
          </div>
          <p className="relative mt-3 text-4xl font-extrabold tabular-nums">{formatAmount(w.balance)}</p>
          <p className="relative mt-1 text-sm text-indigo-200">{user.name} · {user.id}</p>
          <p className="relative mt-4"><button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-indigo-700 shadow hover:bg-indigo-50"><Plus className="h-4 w-4" /> Add Money</button></p>
        </div>
        <StatCard label="Money in" value={formatAmount(w.credits)} icon={ArrowDownLeft} tone="green" simulated />
        <StatCard label="Money out" value={formatAmount(w.debits)} icon={ArrowUpRight} tone="red" simulated hint={w.pending ? `${formatAmount(w.pending)} pending` : undefined} />
      </div>

      <Card className="mt-6">
        <CardHeader
          title="History"
          icon={Receipt}
          action={<Tabs value={filter} onChange={setFilter} tabs={[{ value: 'all', label: 'All' }, { value: 'Credit', label: 'Money in' }, { value: 'Debit', label: 'Money out' }, { value: 'Pending', label: 'Pending' }, { value: 'Failed', label: 'Failed' }]} />}
        />
        <DataTable
          rows={rows}
          initialSort={{ key: 'createdAt', dir: 'desc' }}
          empty={<EmptyState icon={Receipt} title="No transactions" message="Use Add Money to get started." />}
          columns={[
            { key: 'id', header: 'ID', render: (t) => <span className="font-mono text-xs">{t.id}</span> },
            { key: 'createdAt', header: 'Date', render: (t) => formatDateTime(t.createdAt) },
            { key: 'description', header: 'Description' },
            { key: 'type', header: 'Type', render: (t) => <StatusBadge status={t.type} /> },
            { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
            { key: 'amount', header: 'Amount', align: 'right', render: (t) => <Money value={t.type === 'Credit' ? t.amount : -t.amount} className={cx(t.status !== 'Completed' && 'opacity-50 line-through decoration-slate-300')} /> },
          ]}
        />
      </Card>

      <AddMoneyModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
