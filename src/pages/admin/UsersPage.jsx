import { useState } from 'react';
import { Edit3, Eye, Search, UserCheck, UserX, Users } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import {
  Button, Card, ConfirmDialog, DataTable, EmptyState, Field, Input, KeyValue, Modal, PageHeader, Select, StatusBadge, useToast,
} from '../../components/ui';
import { summarizePnl, walletSummary } from '../../utils/calculations';
import { formatAmount, formatDate } from '../../utils/formatters';
import { isEmail, isMobile } from '../../utils/validation';

export default function UsersPage() {
  const data = useAppData();
  const { user: me } = useAuth();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [statusF, setStatusF] = useState('');
  const [view, setView] = useState(null);
  const [edit, setEdit] = useState(null);
  const [errors, setErrors] = useState({});
  const [toggle, setToggle] = useState(null);

  const rows = data.users
    .filter((u) => !statusF || u.status === statusF)
    .filter((u) => !q || [u.name, u.username, u.email, u.id].some((s) => s.toLowerCase().includes(q.toLowerCase())));

  const saveEdit = () => {
    const e = {};
    if (!edit.name.trim()) e.name = 'Required.';
    if (!isEmail(edit.email)) e.email = 'Invalid email.';
    if (!isMobile(edit.mobile)) e.mobile = 'Invalid mobile.';
    setErrors(e);
    if (Object.keys(e).length) return;
    data.updateUser(edit.id, { name: edit.name.trim(), email: edit.email.trim(), mobile: edit.mobile.trim() });
    toast(`${edit.name} updated.`);
    setEdit(null);
  };

  const viewed = view && data.users.find((u) => u.id === view);
  const viewedClaims = viewed ? data.claims.filter((c) => c.userId === viewed.id) : [];

  return (
    <>
      <PageHeader title="User Management" description="View and manage demo accounts. Deactivated users cannot sign in." />
      <Card>
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 p-4">
          <Field label="Search" className="min-w-[240px] flex-1">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" placeholder="Name, username, email or ID" />
            </div>
          </Field>
          <Field label="Account status" className="w-48">
            <Select value={statusF} onChange={(e) => setStatusF(e.target.value)} placeholder="All" options={['Active', 'Inactive']} />
          </Field>
        </div>
        <DataTable
          rows={rows}
          empty={<EmptyState icon={Users} title="No users match" />}
          columns={[
            { key: 'id', header: 'User ID', render: (u) => <span className="font-mono text-xs">{u.id}</span> },
            { key: 'name', header: 'Name', render: (u) => <span className="font-medium text-slate-900">{u.name}</span> },
            { key: 'username', header: 'Username', render: (u) => `@${u.username}` },
            { key: 'email', header: 'Email' },
            { key: 'role', header: 'Role', render: (u) => <StatusBadge status={u.role === 'admin' ? 'Admin' : 'User'} /> },
            { key: 'registeredAt', header: 'Registered', render: (u) => formatDate(u.registeredAt) },
            { key: 'kyc', header: 'KYC demo', sortValue: (u) => data.kycStatus(u.id), render: (u) => (u.role === 'admin' ? '—' : <StatusBadge status={data.kycStatus(u.id)} />) },
            { key: 'status', header: 'Account', render: (u) => <StatusBadge status={u.status} /> },
            {
              key: 'actions',
              header: '',
              sortable: false,
              render: (u) => (
                <div className="flex justify-end gap-1">
                  <Button size="xs" variant="ghost" icon={Eye} onClick={() => setView(u.id)}>View</Button>
                  <Button size="xs" variant="ghost" icon={Edit3} onClick={() => { setEdit({ ...u }); setErrors({}); }}>Edit</Button>
                  {u.id !== me.id && (
                    <Button size="xs" variant="ghost" icon={u.status === 'Active' ? UserX : UserCheck} className={u.status === 'Active' ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'} onClick={() => setToggle(u)}>
                      {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal open={Boolean(viewed)} onClose={() => setView(null)} size="lg" title={viewed?.name} subtitle={viewed && `@${viewed.username} · ${viewed.id}`} footer={<Button variant="secondary" onClick={() => setView(null)}>Close</Button>}>
        {viewed && (
          <div className="space-y-5">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <KeyValue label="Email">{viewed.email}</KeyValue>
              <KeyValue label="Mobile">{viewed.mobile}</KeyValue>
              <KeyValue label="Registered">{formatDate(viewed.registeredAt)}</KeyValue>
              <KeyValue label="Account"><StatusBadge status={viewed.status} /></KeyValue>
              <KeyValue label="Demo KYC"><StatusBadge status={data.kycStatus(viewed.id)} /></KeyValue>
              <KeyValue label="Risk status"><StatusBadge status={data.getRisk(viewed.id).status} /></KeyValue>
              <KeyValue label="Simulated balance">{formatAmount(walletSummary(data.transactions.filter((t) => t.userId === viewed.id)).balance)}</KeyValue>
              <KeyValue label="Entry records">{data.entryRecords.filter((r) => r.userId === viewed.id).length}</KeyValue>
              <KeyValue label="Simulated net">{formatAmount(summarizePnl(data.pnlRecords.filter((r) => r.userId === viewed.id)).net, { sign: true })}</KeyValue>
            </dl>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Associated claim records</p>
              {viewedClaims.length ? (
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {viewedClaims.map((c) => (
                    <li key={c.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <span className="font-mono text-xs">{c.id}</span>
                      <span>{formatAmount(c.amount)}</span>
                      <StatusBadge status={c.status} />
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-slate-500">No claims.</p>}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(edit)} onClose={() => setEdit(null)} title={`Edit ${edit?.username || ''}`} footer={<><Button variant="secondary" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={saveEdit}>Save</Button></>}>
        {edit && (
          <div className="space-y-3">
            <Field label="Name" error={errors.name}><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} error={errors.name} /></Field>
            <Field label="Email" error={errors.email}><Input value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} error={errors.email} /></Field>
            <Field label="Mobile" error={errors.mobile}><Input value={edit.mobile} onChange={(e) => setEdit({ ...edit, mobile: e.target.value })} error={errors.mobile} /></Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toggle)}
        onClose={() => setToggle(null)}
        tone={toggle?.status === 'Active' ? 'danger' : 'primary'}
        title={toggle?.status === 'Active' ? 'Deactivate demo account?' : 'Activate demo account?'}
        message={toggle?.status === 'Active' ? `${toggle?.name} will no longer be able to sign in.` : `${toggle?.name} will be able to sign in again.`}
        confirmLabel={toggle?.status === 'Active' ? 'Deactivate' : 'Activate'}
        onConfirm={() => {
          data.updateUser(toggle.id, { status: toggle.status === 'Active' ? 'Inactive' : 'Active' });
          toast(`${toggle.name} ${toggle.status === 'Active' ? 'deactivated' : 'activated'}.`);
        }}
      />
    </>
  );
}
