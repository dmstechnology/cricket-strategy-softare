import { useState } from 'react';
import { CheckCircle2, Receipt, XCircle } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { Button, Card, DataTable, DemoNotice, EmptyState, Field, Money, PageHeader, Select, StatCard, StatusBadge, useToast } from '../../components/ui';
import { walletSummary } from '../../utils/calculations';
import { formatAmount, formatDateTime } from '../../utils/formatters';

export default function TransactionsPage() {
  const data = useAppData();
  const toast = useToast();
  const [f, setF] = useState({ userId: '', status: '', type: '' });
  const users = data.users.filter((u) => u.role === 'user');
  const rows = data.transactions.filter((t) => (!f.userId || t.userId === f.userId) && (!f.status || t.status === f.status) && (!f.type || t.type === f.type));
  const sum = walletSummary(rows);

  const setStatus = (t, status) => {
    data.updateTransaction(t.id, { status });
    toast(`${t.id} marked ${status} (simulated).`, status === 'Completed' ? 'success' : 'info');
  };

  return (
    <>
      <PageHeader title="Demo Transactions" description="All simulated wallet transactions across demo users." />
      <DemoNotice title="DEMO WALLET" className="mb-6">All balances and transactions are simulated. No real money is accepted, stored, or transferred.</DemoNotice>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Transactions" value={rows.length} icon={Receipt} tone="indigo" />
        <StatCard label="Completed credits" value={formatAmount(sum.credits)} icon={Receipt} tone="green" simulated />
        <StatCard label="Completed debits" value={formatAmount(sum.debits)} icon={Receipt} tone="red" simulated />
        <StatCard label="Pending" value={formatAmount(sum.pending)} icon={Receipt} tone="amber" simulated />
      </div>
      <Card>
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 p-4">
          <Field label="User" className="w-48"><Select value={f.userId} onChange={(e) => setF({ ...f, userId: e.target.value })} placeholder="All users" options={users.map((u) => ({ value: u.id, label: u.name }))} /></Field>
          <Field label="Type" className="w-40"><Select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} placeholder="All" options={['Credit', 'Debit']} /></Field>
          <Field label="Status" className="w-40"><Select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} placeholder="All" options={['Completed', 'Pending', 'Failed']} /></Field>
        </div>
        <DataTable
          rows={rows}
          initialSort={{ key: 'createdAt', dir: 'desc' }}
          empty={<EmptyState icon={Receipt} title="No transactions" />}
          columns={[
            { key: 'id', header: 'ID', render: (t) => <span className="font-mono text-xs">{t.id}</span> },
            { key: 'user', header: 'User', sortValue: (t) => data.userById(t.userId)?.name, render: (t) => data.userById(t.userId)?.name },
            { key: 'createdAt', header: 'Date', render: (t) => formatDateTime(t.createdAt) },
            { key: 'description', header: 'Description' },
            { key: 'type', header: 'Type', render: (t) => <StatusBadge status={t.type} /> },
            { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
            { key: 'amount', header: 'Amount', align: 'right', render: (t) => <Money value={t.type === 'Credit' ? t.amount : -t.amount} /> },
            {
              key: 'a', header: '', sortable: false,
              render: (t) => t.status === 'Pending' ? (
                <div className="flex justify-end gap-1">
                  <Button size="xs" variant="ghost" icon={CheckCircle2} className="text-emerald-600 hover:bg-emerald-50" onClick={() => setStatus(t, 'Completed')}>Complete</Button>
                  <Button size="xs" variant="ghost" icon={XCircle} className="text-red-600 hover:bg-red-50" onClick={() => setStatus(t, 'Failed')}>Fail</Button>
                </div>
              ) : null,
            },
          ]}
        />
      </Card>
    </>
  );
}
