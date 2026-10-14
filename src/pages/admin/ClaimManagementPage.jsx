import { useState } from 'react';
import { FileText, RotateCcw, Save } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import {
  Alert, Button, Card, DataTable, EmptyState, Field, Input, KeyValue, Modal, PageHeader, Select, StatusBadge, Tabs, Textarea, useToast,
} from '../../components/ui';
import ClaimStatusTimeline from '../user/ClaimStatusTimeline';
import { formatAmount, formatDate, formatDateTime } from '../../utils/formatters';

const STATUSES = ['Submitted', 'Under Review', 'Approved (Simulated)', 'Processing', 'Completed (Simulated)', 'Rejected (Simulated)'];
const ACTIVE = ['Submitted', 'Under Review', 'Approved (Simulated)', 'Processing'];

export default function ClaimManagementPage() {
  const data = useAppData();
  const toast = useToast();
  const [tab, setTab] = useState('active');
  const [edit, setEdit] = useState(null);
  const rows = data.claims.filter((c) => (tab === 'active' ? ACTIVE.includes(c.status) : tab === 'closed' ? !ACTIVE.includes(c.status) : true));
  const original = edit && data.claims.find((c) => c.id === edit.id);

  const save = () => {
    if (!edit.message.trim()) return toast('The user-facing message cannot be empty.', 'danger');
    if (!edit.processingTime.trim()) return toast('Set an estimated processing duration.', 'danger');
    data.updateClaim(edit.id, { status: edit.status, message: edit.message.trim(), processingTime: edit.processingTime.trim(), internalNotes: edit.internalNotes }, edit.historyNote.trim());
    toast(`${edit.id} saved. The user's dashboard, claim history and notifications are updated.`, 'success', 'Claim updated');
    setEdit(null);
  };

  return (
    <>
      <PageHeader title="Claim Management" description="Review demo claims, change their simulated status and edit the message users see." />
      <Alert type="demo" title="Simulated claims" className="mb-6">Changing a status to Approved or Completed does not pay anything. Messages must not imply a real payout commitment.</Alert>
      <Card>
        <div className="border-b border-slate-100 p-4">
          <Tabs value={tab} onChange={setTab} tabs={[{ value: 'active', label: 'Active', count: data.claims.filter((c) => ACTIVE.includes(c.status)).length }, { value: 'closed', label: 'Closed' }, { value: 'all', label: 'All', count: data.claims.length }]} className="w-fit" />
        </div>
        <DataTable
          rows={rows}
          initialSort={{ key: 'updatedAt', dir: 'desc' }}
          onRowClick={(c) => setEdit({ ...c, historyNote: '' })}
          empty={<EmptyState icon={FileText} title="No claims here" />}
          columns={[
            { key: 'id', header: 'Claim ID', render: (c) => <span className="font-mono text-xs font-semibold">{c.id}</span> },
            { key: 'user', header: 'User', sortValue: (c) => data.userById(c.userId)?.name, render: (c) => data.userById(c.userId)?.name },
            { key: 'amount', header: 'Demo amount', align: 'right', render: (c) => formatAmount(c.amount) },
            { key: 'submittedAt', header: 'Submitted', render: (c) => formatDate(c.submittedAt) },
            { key: 'kyc', header: 'Demo KYC', sortable: false, render: (c) => <StatusBadge status={data.kycStatus(c.userId)} /> },
            { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
            { key: 'processingTime', header: 'Processing time' },
            { key: 'updatedAt', header: 'Last updated', render: (c) => formatDateTime(c.updatedAt) },
            { key: 'a', header: '', sortable: false, render: (c) => <Button size="xs" variant="soft" onClick={(e) => { e.stopPropagation(); setEdit({ ...c, historyNote: '' }); }}>Manage</Button> },
          ]}
        />
      </Card>

      <Modal open={Boolean(edit)} onClose={() => setEdit(null)} size="xl" title={`Manage ${edit?.id || ''}`} subtitle={edit && `${data.userById(edit.userId)?.name} · ${edit.category} · ${formatAmount(edit.amount)} (demo)`} footer={<><Button variant="secondary" onClick={() => setEdit(null)}>Cancel</Button><Button icon={Save} onClick={save}>Save changes</Button></>}>
        {edit && (
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-3">
              <dl className="grid grid-cols-2 gap-4">
                <KeyValue label="Submitted">{formatDateTime(edit.submittedAt)}</KeyValue>
                <KeyValue label="Demo KYC"><StatusBadge status={data.kycStatus(edit.userId)} /></KeyValue>
                <KeyValue label="Explanation" className="col-span-2">{edit.explanation || '—'}</KeyValue>
              </dl>
              {!data.kycStatus(edit.userId).startsWith('Approved') && <Alert type="warning">This user's demo KYC is not approved.</Alert>}
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Claim status"><Select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })} options={STATUSES} /></Field>
                <Field label="Estimated processing duration"><Input value={edit.processingTime} onChange={(e) => setEdit({ ...edit, processingTime: e.target.value })} placeholder="e.g. 2–3 days" /></Field>
              </div>
              <Field label="User-facing message" hint="Shown on the user's Claim page, Claim History and Notifications.">
                <Textarea rows={4} value={edit.message} onChange={(e) => setEdit({ ...edit, message: e.target.value })} />
              </Field>
              <Button size="xs" variant="ghost" icon={RotateCcw} onClick={() => setEdit({ ...edit, message: data.settings.claimDefaultMessage, processingTime: data.settings.claimProcessingTime })}>Use default message & duration</Button>
              {edit.status !== original?.status && (
                <Field label="Status-change note (history)"><Input value={edit.historyNote} onChange={(e) => setEdit({ ...edit, historyNote: e.target.value })} placeholder="Optional note for the status history" /></Field>
              )}
              <Field label="Internal demo notes (admin only)"><Textarea value={edit.internalNotes} onChange={(e) => setEdit({ ...edit, internalNotes: e.target.value })} /></Field>
            </div>
            <div className="lg:col-span-2">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status history</p>
              <ClaimStatusTimeline history={edit.history} />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
