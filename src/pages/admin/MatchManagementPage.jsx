import { useState } from 'react';
import { Edit3, Plus, Trash2, Trophy } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import {
  Alert, Badge, Button, Card, ConfirmDialog, DataTable, EmptyState, Field, Input, Modal, PageHeader, Select, StatusBadge,
  Textarea, TeamBadge, useToast,
} from '../../components/ui';
import { TEAMS, TOURNAMENTS } from '../../data/mockMatches';
import { formatAmount, formatDate } from '../../utils/formatters';

const STATUSES = ['Upcoming', 'In Progress', 'Completed', 'Abandoned'];
const blank = () => ({ teamA: 'CK', teamB: 'HH', tournament: TOURNAMENTS[0], format: 'T20', date: new Date().toISOString().slice(0, 10), time: '19:30', venue: '', status: 'Upcoming', notes: '', result: '', entryAmount: '100' });

export default function MatchManagementPage() {
  const data = useAppData();
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [toDelete, setToDelete] = useState(null);
  const [statusF, setStatusF] = useState('');

  const open = (m) => {
    setErrors({});
    setForm(m ? { ...m, teamA: m.teamA.short, teamB: m.teamB.short, result: m.result || '', entryAmount: String(m.entryAmount ?? 0) } : blank());
  };

  const save = () => {
    const e = {};
    if (form.teamA === form.teamB) e.teamB = 'Choose two different teams.';
    if (!form.tournament.trim()) e.tournament = 'Required.';
    if (!form.date) e.date = 'Required.';
    if (!/^\d{2}:\d{2}$/.test(form.time)) e.time = 'Use HH:MM.';
    if (!form.venue.trim()) e.venue = 'Required.';
    if (!/^\d+(\.\d{1,2})?$/.test(String(form.entryAmount).trim())) e.entryAmount = 'Enter 0 or a positive amount.';
    setErrors(e);
    if (Object.keys(e).length) return;
    const payload = { ...form, teamA: TEAMS[form.teamA], teamB: TEAMS[form.teamB], venue: form.venue.trim(), tournament: form.tournament.trim(), entryAmount: Number(form.entryAmount) };
    if (form.id) {
      data.updateMatch(form.id, payload);
      toast(`${form.id} updated — visible to all users immediately.`, 'success', 'Match saved');
    } else {
      data.addMatch(payload);
      toast(`${TEAMS[form.teamA].short} vs ${TEAMS[form.teamB].short} added to Upcoming Matches.`, 'success', 'Match created');
    }
    setForm(null);
  };

  const rows = data.matches.filter((m) => !statusF || m.status === statusF);
  const entryCount = (id) => data.entryRecords.filter((r) => r.kind === 'simple' && r.matchId === id).length;
  const teamOptions = Object.values(TEAMS).map((t) => ({ value: t.short, label: `${t.name} (${t.short})` }));

  return (
    <>
      <PageHeader title="Match Management" description="Add, edit and delete fictional demo fixtures. Changes appear immediately in every user's dashboard." actions={<Button icon={Plus} onClick={() => open(null)}>Add match</Button>} />
      <Card>
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 p-4">
          <Field label="Status" className="w-48"><Select value={statusF} onChange={(e) => setStatusF(e.target.value)} placeholder="All" options={STATUSES} /></Field>
        </div>
        <DataTable
          rows={rows}
          initialSort={{ key: 'date', dir: 'asc' }}
          empty={<EmptyState icon={Trophy} title="No matches" action={<Button onClick={() => open(null)} icon={Plus}>Add match</Button>} />}
          columns={[
            { key: 'id', header: 'ID', render: (m) => <span className="font-mono text-xs">{m.id}</span> },
            { key: 'teams', header: 'Teams', sortValue: (m) => m.teamA.name, render: (m) => <div className="flex items-center gap-2"><TeamBadge team={m.teamA} size="sm" /><span className="text-xs text-slate-400">vs</span><TeamBadge team={m.teamB} size="sm" /><span className="ml-1 font-medium">{m.teamA.short} vs {m.teamB.short}</span></div> },
            { key: 'tournament', header: 'Tournament' },
            { key: 'format', header: 'Format', render: (m) => <Badge tone="indigo">{m.format}</Badge> },
            { key: 'date', header: 'Date', render: (m) => `${formatDate(m.date)} ${m.time}` },
            { key: 'venue', header: 'Venue' },
            { key: 'entryAmount', header: 'Entry', align: 'right', render: (m) => (Number(m.entryAmount) > 0 ? formatAmount(Number(m.entryAmount), { decimals: 0 }) : 'Free') },
            { key: 'entries', header: 'Entries', align: 'right', sortValue: (m) => entryCount(m.id), render: (m) => entryCount(m.id) },
            { key: 'status', header: 'Status', render: (m) => <StatusBadge status={m.status} /> },
            {
              key: 'a', header: '', sortable: false,
              render: (m) => (
                <div className="flex justify-end gap-1">
                  <Button size="xs" variant="ghost" icon={Edit3} onClick={() => open(m)}>Edit</Button>
                  <Button size="xs" variant="ghost" icon={Trash2} className="text-red-600 hover:bg-red-50" onClick={() => setToDelete(m)}>Delete</Button>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal open={Boolean(form)} onClose={() => setForm(null)} size="lg" title={form?.id ? `Edit ${form.id}` : 'Add demo match'} subtitle="Use fictional fixtures only." footer={<><Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button><Button onClick={save}>{form?.id ? 'Save changes' : 'Create match'}</Button></>}>
        {form && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Team A"><Select value={form.teamA} onChange={(e) => setForm({ ...form, teamA: e.target.value })} options={teamOptions} /></Field>
            <Field label="Team B" error={errors.teamB}><Select value={form.teamB} onChange={(e) => setForm({ ...form, teamB: e.target.value })} options={teamOptions} error={errors.teamB} /></Field>
            <Field label="Tournament" error={errors.tournament}>
              <Input list="tournaments" value={form.tournament} onChange={(e) => setForm({ ...form, tournament: e.target.value })} error={errors.tournament} />
              <datalist id="tournaments">{TOURNAMENTS.map((t) => <option key={t} value={t} />)}</datalist>
            </Field>
            <Field label="Format"><Select value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })} options={['T20', 'ODI', 'Test']} /></Field>
            <Field label="Date" error={errors.date}><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} error={errors.date} /></Field>
            <Field label="Time" error={errors.time}><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} error={errors.time} /></Field>
            <Field label="Venue" error={errors.venue}><Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} error={errors.venue} placeholder="e.g. Harbour Oval" /></Field>
            <Field label="Status"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={STATUSES} /></Field>
            <Field label="Entry amount (₹, demo)" error={errors.entryAmount} hint="Users pay this from their demo wallet for Entry Check. Use 0 for a free entry." className="sm:col-span-2">
              <Input inputMode="decimal" value={form.entryAmount} onChange={(e) => setForm({ ...form, entryAmount: e.target.value })} error={errors.entryAmount} />
            </Field>
            <Field label="Result text (fictional)" className="sm:col-span-2"><Input value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} placeholder="Optional" /></Field>
            <Field label="Informational strategy notes" className="sm:col-span-2"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title="Delete match?"
        message={
          <>
            {toDelete?.id} will be removed from every user's view.{' '}
            {data.entryRecords.some((r) => r.matchId === toDelete?.id) && 'Existing strategy records will keep the match ID but show it as unknown.'}
          </>
        }
        confirmLabel="Delete match"
        onConfirm={() => { data.deleteMatch(toDelete.id); toast(`${toDelete.id} deleted.`, 'info'); }}
      />
      <Alert type="info" className="mt-6">Match data is fictional. A production system would source fixtures from a licensed data provider via a backend.</Alert>
    </>
  );
}
