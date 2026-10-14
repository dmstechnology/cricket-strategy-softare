import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { Alert, Button, Card, DataTable, EmptyState, Field, KeyValue, Modal, PageHeader, StatusBadge, Tabs, Textarea, useToast } from '../../components/ui';
import { formatDateTime } from '../../utils/formatters';

const STATUSES = ['Pending Review', 'Approved (Simulated)', 'Rejected (Simulated)'];

export default function KycManagementPage() {
  const data = useAppData();
  const toast = useToast();
  const [tab, setTab] = useState('Pending Review');
  const [edit, setEdit] = useState(null);
  const rows = data.kycRecords.filter((k) => tab === 'all' || k.status === tab);

  const save = () => {
    data.updateKyc(edit.id, { status: edit.status, remarks: edit.remarks.trim() });
    toast(`${edit.reference} set to ${edit.status}. The user has been notified.`, 'success', 'Demo KYC updated');
    setEdit(null);
  };

  return (
    <>
      <PageHeader title="KYC Management" description="Review demo KYC requests and set their simulated status." />
      <Alert type="demo" title="No real verification" className="mb-6">
        Records contain only fictional, masked references. Changing a status here does not verify anyone's identity.
      </Alert>
      <Card>
        <div className="border-b border-slate-100 p-4">
          <Tabs value={tab} onChange={setTab} tabs={[...STATUSES.map((s) => ({ value: s, label: s.replace(' (Simulated)', ''), count: data.kycRecords.filter((k) => k.status === s).length })), { value: 'all', label: 'All', count: data.kycRecords.length }]} className="w-fit max-w-full" />
        </div>
        <DataTable
          rows={rows}
          initialSort={{ key: 'submittedAt', dir: 'desc' }}
          onRowClick={(k) => setEdit({ ...k })}
          empty={<EmptyState icon={ShieldCheck} title="No requests in this state" />}
          columns={[
            { key: 'reference', header: 'Reference', render: (k) => <span className="font-mono text-xs">{k.reference}</span> },
            { key: 'displayName', header: 'Display name' },
            { key: 'user', header: 'Username', render: (k) => `@${data.userById(k.userId)?.username}` },
            { key: 'docCategory', header: 'Demo document' },
            { key: 'docReference', header: 'Masked ref.', render: (k) => <span className="font-mono">{k.docReference}</span> },
            { key: 'submittedAt', header: 'Submitted', render: (k) => formatDateTime(k.submittedAt) },
            { key: 'status', header: 'Status', render: (k) => <StatusBadge status={k.status} /> },
            { key: 'remarks', header: 'Remarks', render: (k) => <span className="block max-w-[200px] truncate text-slate-500">{k.remarks || '—'}</span> },
            { key: 'a', header: '', sortable: false, render: (k) => <Button size="xs" variant="soft" onClick={(e) => { e.stopPropagation(); setEdit({ ...k }); }}>Review</Button> },
          ]}
        />
      </Card>

      <Modal open={Boolean(edit)} onClose={() => setEdit(null)} title={`Review ${edit?.reference || ''}`} footer={<><Button variant="secondary" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save}>Save status</Button></>}>
        {edit && (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-4">
              <KeyValue label="Display name">{edit.displayName}</KeyValue>
              <KeyValue label="Demo document">{edit.docCategory}</KeyValue>
              <KeyValue label="Masked reference"><span className="font-mono">{edit.docReference}</span></KeyValue>
              <KeyValue label="Submitted">{formatDateTime(edit.submittedAt)}</KeyValue>
            </dl>
            <Field label="Simulated status">
              <div className="grid grid-cols-3 gap-2">
                {STATUSES.map((s) => (
                  <button key={s} type="button" onClick={() => setEdit({ ...edit, status: s })} className={`rounded-lg border px-2 py-2 text-xs font-semibold ${edit.status === s ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Admin remarks (shown to the user)">
              <Textarea value={edit.remarks} onChange={(e) => setEdit({ ...edit, remarks: e.target.value })} placeholder="e.g. Demo approval" />
            </Field>
          </div>
        )}
      </Modal>
    </>
  );
}
