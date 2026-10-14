import { useState } from 'react';
import { Edit3, Eye, EyeOff, Megaphone, Plus, Trash2 } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { Badge, Button, Card, ConfirmDialog, DataTable, EmptyState, Field, Input, Modal, PageHeader, Select, StatusBadge, Tabs, Textarea, Toggle, useToast } from '../../components/ui';
import NotificationsView from '../shared/NotificationsView';
import { formatDateTime } from '../../utils/formatters';

const AUDIENCES = [{ value: 'all', label: 'Everyone' }, { value: 'users', label: 'All users' }, { value: 'admins', label: 'Admins only' }];
const TYPES = [{ value: 'info', label: 'Info' }, { value: 'success', label: 'Success' }, { value: 'warning', label: 'Warning' }, { value: 'danger', label: 'Critical' }];
const blank = { title: '', message: '', audience: 'users', type: 'info', published: true };

export default function AdminNotificationsPage() {
  const data = useAppData();
  const toast = useToast();
  const [tab, setTab] = useState('manage');
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [toDelete, setToDelete] = useState(null);
  const announcements = data.notifications.filter((n) => n.kind === 'announcement');

  const save = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required.';
    if (!form.message.trim()) e.message = 'Message is required.';
    setErrors(e);
    if (Object.keys(e).length) return;
    const payload = { title: form.title.trim(), message: form.message.trim(), audience: form.audience, type: form.type, published: form.published };
    if (form.id) data.updateNotification(form.id, payload);
    else data.addNotification({ ...payload, kind: 'announcement' });
    toast(form.published ? 'Announcement published.' : 'Draft saved (unpublished).');
    setForm(null);
  };

  return (
    <>
      <PageHeader title="Notifications" description="Create, edit, publish and unpublish demo announcements." actions={<Button icon={Plus} onClick={() => { setErrors({}); setForm({ ...blank }); }}>New announcement</Button>} />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'manage', label: 'Announcements', count: announcements.length }, { value: 'inbox', label: 'My inbox' }]} className="mb-6 w-fit" />
      {tab === 'inbox' ? (
        <NotificationsView />
      ) : (
        <Card>
          <DataTable
            rows={announcements}
            initialSort={{ key: 'createdAt', dir: 'desc' }}
            empty={<EmptyState icon={Megaphone} title="No announcements" />}
            columns={[
              { key: 'title', header: 'Title', render: (n) => <span className="font-medium text-slate-900">{n.title}</span> },
              { key: 'message', header: 'Message', render: (n) => <span className="block max-w-[320px] truncate text-slate-500">{n.message}</span> },
              { key: 'audience', header: 'Audience', render: (n) => AUDIENCES.find((a) => a.value === n.audience)?.label },
              { key: 'type', header: 'Type', render: (n) => <Badge tone={{ info: 'blue', success: 'green', warning: 'amber', danger: 'red' }[n.type]}>{TYPES.find((t) => t.value === n.type)?.label}</Badge> },
              { key: 'published', header: 'State', render: (n) => <StatusBadge status={n.published ? 'Published' : 'Unpublished'} /> },
              { key: 'createdAt', header: 'Created', render: (n) => formatDateTime(n.createdAt) },
              {
                key: 'a', header: '', sortable: false,
                render: (n) => (
                  <div className="flex justify-end gap-1">
                    <Button size="xs" variant="ghost" icon={n.published ? EyeOff : Eye} onClick={() => { data.updateNotification(n.id, { published: !n.published }); toast(n.published ? 'Unpublished.' : 'Published.'); }}>{n.published ? 'Unpublish' : 'Publish'}</Button>
                    <Button size="xs" variant="ghost" icon={Edit3} onClick={() => { setErrors({}); setForm({ ...n }); }}>Edit</Button>
                    <Button size="xs" variant="ghost" icon={Trash2} className="text-red-600 hover:bg-red-50" onClick={() => setToDelete(n)} aria-label="Delete" />
                  </div>
                ),
              },
            ]}
          />
        </Card>
      )}

      <Modal open={Boolean(form)} onClose={() => setForm(null)} title={form?.id ? 'Edit announcement' : 'New announcement'} footer={<><Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        {form && (
          <div className="space-y-3">
            <Field label="Title" required error={errors.title}><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} error={errors.title} /></Field>
            <Field label="Message" required error={errors.message}><Textarea rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} error={errors.message} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Audience"><Select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} options={AUDIENCES} /></Field>
              <Field label="Type"><Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} options={TYPES} /></Field>
            </div>
            <Toggle checked={form.published} onChange={(v) => setForm({ ...form, published: v })} label={form.published ? 'Published' : 'Draft (unpublished)'} />
          </div>
        )}
      </Modal>
      <ConfirmDialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} title="Delete announcement?" message={`"${toDelete?.title}" will be removed for everyone.`} confirmLabel="Delete" onConfirm={() => { data.deleteNotification(toDelete.id); toast('Announcement deleted.', 'info'); }} />
    </>
  );
}
