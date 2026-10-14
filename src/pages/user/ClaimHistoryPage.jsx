import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, DataTable, DemoNotice, EmptyState, KeyValue, Modal, PageHeader, StatusBadge, Tabs } from '../../components/ui';
import ClaimStatusTimeline, { ClaimProgress } from './ClaimStatusTimeline';
import { formatAmount, formatDate, formatDateTime } from '../../utils/formatters';

export default function ClaimHistoryPage() {
  const data = useAppData();
  const { user } = useAuth();
  const [tab, setTab] = useState('all');
  const [viewId, setViewId] = useState(null);
  const kycStatus = data.kycStatus(user.id);
  const mine = data.claims.filter((c) => c.userId === user.id);
  const rows = mine.filter((c) => {
    if (tab === 'active') return !['Completed (Simulated)', 'Rejected (Simulated)'].includes(c.status);
    if (tab === 'closed') return ['Completed (Simulated)', 'Rejected (Simulated)'].includes(c.status);
    return true;
  });
  const view = data.claims.find((c) => c.id === viewId);

  return (
    <>
      <PageHeader
        title="My Claims"
        description="All money requests you have made and their latest status."
        actions={<Link to="/user/claims"><Button icon={Plus}>New claim</Button></Link>}
      />
      <DemoNotice className="mb-6">Simulated statuses only — "Approved" or "Completed" never means a real payment has been made.</DemoNotice>
      <Card>
        <div className="border-b border-slate-100 p-4">
          <Tabs value={tab} onChange={setTab} tabs={[{ value: 'all', label: 'All', count: mine.length }, { value: 'active', label: 'Active' }, { value: 'closed', label: 'Closed' }]} className="w-fit" />
        </div>
        <DataTable
          rows={rows}
          initialSort={{ key: 'updatedAt', dir: 'desc' }}
          onRowClick={(c) => setViewId(c.id)}
          empty={<EmptyState icon={FileText} title="No claims yet" message="Submit a demo claim once your demo KYC is approved." action={<Link to="/user/claims"><Button variant="secondary">Submit a claim</Button></Link>} />}
          columns={[
            { key: 'id', header: 'Claim ID', render: (c) => <span className="font-mono text-xs font-semibold">{c.id}</span> },
            { key: 'category', header: 'Category' },
            { key: 'amount', header: 'Amount', align: 'right', render: (c) => formatAmount(c.amount) },
            { key: 'submittedAt', header: 'Submitted', render: (c) => formatDate(c.submittedAt) },
            { key: 'kyc', header: 'ID check', sortable: false, render: () => <StatusBadge status={kycStatus} /> },
            { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
            { key: 'message', header: 'Message', sortable: false, render: (c) => <span className="block max-w-[280px] truncate text-slate-500" title={c.message}>{c.message}</span> },
            { key: 'processingTime', header: 'Est. time' },
            { key: 'updatedAt', header: 'Last updated', render: (c) => formatDateTime(c.updatedAt) },
          ]}
        />
      </Card>

      <Modal open={Boolean(view)} onClose={() => setViewId(null)} size="lg" title={`Claim ${view?.id || ''}`} subtitle="Simulated claim — no real payout" footer={<Button variant="secondary" onClick={() => setViewId(null)}>Close</Button>}>
        {view && (
          <div className="space-y-5">
            <div className="flex items-center justify-between"><StatusBadge status={view.status} /><span className="text-xs text-slate-400">Updated {formatDateTime(view.updatedAt)}</span></div>
            <ClaimProgress status={view.status} />
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <KeyValue label="Category">{view.category}</KeyValue>
              <KeyValue label="Requested demo amount">{formatAmount(view.amount)}</KeyValue>
              <KeyValue label="Estimated processing">{view.processingTime}</KeyValue>
              <KeyValue label="Submitted">{formatDateTime(view.submittedAt)}</KeyValue>
              <KeyValue label="Demo KYC"><StatusBadge status={kycStatus} /></KeyValue>
              <KeyValue label="Explanation">{view.explanation || '—'}</KeyValue>
            </dl>
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Admin message</p>
              <p className="mt-1 text-sm text-slate-700">{view.message}</p>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status history</p>
              <ClaimStatusTimeline history={view.history} />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
