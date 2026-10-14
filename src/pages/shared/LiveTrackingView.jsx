import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Activity, CalendarDays, Clock, Edit3, Link2, MapPin, Plus, Radio, Trash2, Trophy } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import {
  Alert, Badge, Button, Card, CardHeader, ConfirmDialog, EmptyState, Field, Input, KeyValue, Modal, Select,
  StatusBadge, Textarea, TeamBadge, useToast, cx,
} from '../../components/ui';
import { ScoreProgressChart } from '../../components/charts/Charts';
import { matchTitle, runRate } from '../../utils/calculations';
import { formatDate, formatDateTime, formatTime, toDateTimeInput } from '../../utils/formatters';
import { validateScoreUpdate } from '../../utils/validation';

const STATUSES = ['Upcoming', 'In Progress', 'Completed', 'Abandoned'];

function emptyForm(match, latest) {
  return {
    battingTeam: latest?.battingTeam || match?.teamA.short || '',
    score: '',
    wickets: '',
    overs: '',
    runRateNote: '',
    status: match?.status === 'Upcoming' ? 'In Progress' : match?.status || 'In Progress',
    notes: '',
    relatedRecordId: '',
    timestamp: toDateTimeInput(),
  };
}

export default function LiveTrackingView({ admin = false }) {
  const data = useAppData();
  const { user } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  const ordered = useMemo(() => {
    const rank = { 'In Progress': 0, Upcoming: 1, Completed: 2, Abandoned: 3 };
    return [...data.matches].sort((a, b) => rank[a.status] - rank[b.status] || (a.date < b.date ? -1 : 1));
  }, [data.matches]);

  const matchId = params.get('match') || ordered[0]?.id;
  const match = data.matches.find((m) => m.id === matchId);

  const updates = useMemo(
    () =>
      data.matchUpdates
        .filter((u) => u.matchId === matchId)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
    [data.matchUpdates, matchId]
  );
  const latest = updates[updates.length - 1];
  const relatedRecords = data.entryRecords.filter((r) => r.matchId === matchId && (admin || r.userId === user.id));

  const [form, setForm] = useState(() => emptyForm(match, latest));
  const [errors, setErrors] = useState({});
  const [editing, setEditing] = useState(null); // update being edited
  const [toDelete, setToDelete] = useState(null);
  const [matchEdit, setMatchEdit] = useState(null);

  const selectMatch = (id) => {
    setParams({ match: id });
    const m = data.matches.find((x) => x.id === id);
    const l = data.matchUpdates.filter((u) => u.matchId === id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    setForm(emptyForm(m, l));
    setErrors({});
  };

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const validate = (values) => {
    const e = validateScoreUpdate(values, match.format);
    if (!values.battingTeam) e.battingTeam = 'Select the batting team.';
    if (!values.timestamp || Number.isNaN(new Date(values.timestamp).getTime())) e.timestamp = 'Enter a valid timestamp.';
    return e;
  };

  const submit = (ev) => {
    ev.preventDefault();
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length) return;
    data.addMatchUpdate({
      matchId,
      userId: user.id,
      battingTeam: form.battingTeam,
      score: Number(form.score),
      wickets: Number(form.wickets),
      overs: Number(form.overs),
      runRateNote: form.runRateNote.trim(),
      status: form.status,
      notes: form.notes.trim(),
      relatedRecordId: form.relatedRecordId,
      timestamp: new Date(form.timestamp).toISOString(),
    });
    toast(`Update saved for ${matchTitle(match)}.`, 'success', 'Match update recorded');
    setForm({ ...emptyForm({ ...match, status: form.status }, { battingTeam: form.battingTeam }), status: form.status });
  };

  const saveEdit = () => {
    const e = validate(editing);
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    data.updateMatchUpdate(editing.id, {
      ...editing,
      score: Number(editing.score),
      wickets: Number(editing.wickets),
      overs: Number(editing.overs),
      timestamp: new Date(editing.timestamp).toISOString(),
    });
    setEditing(null);
    setErrors({});
    toast('Observation updated.', 'success');
  };

  const crr = latest ? runRate(latest.score, latest.overs) : null;
  const chartData = updates.map((u) => ({ label: `${u.battingTeam} ${u.overs}`, score: u.score }));

  if (!match) {
    return (
      <Card>
        <EmptyState icon={Trophy} title="No matches available" message="Ask the admin to add a demo match first." />
      </Card>
    );
  }

  const canModify = (u) => admin || u.userId === user.id;
  const recordOptions = relatedRecords.map((r) => ({ value: r.id, label: `${r.id} · ${r.configName} (${r.decision})` }));

  return (
    <div className="space-y-6">
      <Alert type="warning" title="Manual entry only — not a live score feed">
        Scores and observations on this page are typed in by users or the admin. They are not live, not externally verified and
        are not connected to any betting exchange. Nothing here executes a financial action.
      </Alert>

      {/* Match selector */}
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
        {ordered.map((m) => {
          const l = data.matchUpdates.filter((u) => u.matchId === m.id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
          return (
            <button
              key={m.id}
              onClick={() => selectMatch(m.id)}
              className={cx(
                'min-w-[190px] rounded-xl border bg-white p-3 text-left transition',
                m.id === matchId ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-800">{matchTitle(m)}</span>
                {m.status === 'In Progress' && <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />}
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {m.format} · {formatDate(m.date)}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <StatusBadge status={m.status} />
                {l && (
                  <span className="whitespace-nowrap text-xs font-semibold tabular-nums text-slate-700">
                    {l.score}/{l.wickets} ({l.overs})
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Match panel */}
        <div className="space-y-6 xl:col-span-2">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-navy-900 to-navy-700 p-5 text-white">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-indigo-200">
                  <span className="font-mono">{match.id}</span>·<span>{match.tournament}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="indigo">{match.format}</Badge>
                  <StatusBadge status={match.status} />
                  {admin && (
                    <Button size="xs" variant="secondary" icon={Edit3} onClick={() => setMatchEdit({ status: match.status, notes: match.notes, result: match.result || '' })}>
                      Edit match
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between gap-4">
                <div className="flex flex-1 flex-col items-center text-center">
                  <TeamBadge team={match.teamA} size="lg" />
                  <p className="mt-2 text-sm font-semibold">{match.teamA.name}</p>
                </div>
                <div className="text-center">
                  {latest ? (
                    <>
                      <p className="text-xs text-indigo-200">{latest.battingTeam} batting</p>
                      <p className="text-4xl font-extrabold tabular-nums">
                        {latest.score}/{latest.wickets}
                      </p>
                      <p className="text-sm text-indigo-100">{latest.overs} overs</p>
                    </>
                  ) : (
                    <p className="text-2xl font-bold text-indigo-200">VS</p>
                  )}
                </div>
                <div className="flex flex-1 flex-col items-center text-center">
                  <TeamBadge team={match.teamB} size="lg" />
                  <p className="mt-2 text-sm font-semibold">{match.teamB.name}</p>
                </div>
              </div>
              <p className="mt-4 text-center text-[11px] text-indigo-200">
                {latest ? `Last manual update ${formatDateTime(latest.timestamp)}` : 'No manual updates yet'}
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
              <KeyValue label="Schedule">
                <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5 text-slate-400" />{formatDate(match.date)}</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-slate-400" />{match.time}</span>
              </KeyValue>
              <KeyValue label="Venue">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-400" />{match.venue}</span>
              </KeyValue>
              <KeyValue label="Current run rate">
                <span className="font-semibold">{crr === null ? '—' : crr.toFixed(2)}</span>
                <span className="block text-[11px] text-slate-400">Calculated from entered data</span>
              </KeyValue>
              <KeyValue label="Observations">
                <span className="font-semibold">{updates.length}</span>
              </KeyValue>
            </dl>
            {match.notes && <p className="mx-5 mb-5 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{match.notes}</p>}
          </Card>

          <ScoreProgressChart data={chartData} />

          {/* Timeline */}
          <Card>
            <CardHeader title="Match observation timeline" subtitle="Chronological — oldest first" icon={Activity} />
            {updates.length ? (
              <ol className="relative px-5 py-4">
                {updates.map((u, i) => {
                  const author = data.userById(u.userId);
                  const isLast = i === updates.length - 1;
                  const rr = runRate(u.score, u.overs);
                  return (
                    <li key={u.id} className="relative flex gap-4 pb-6 last:pb-0">
                      {!isLast && <span className="absolute left-[15px] top-8 h-full w-px bg-slate-200" />}
                      <span className={cx('relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold', isLast ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : 'bg-slate-100 text-slate-600')}>
                        {u.battingTeam}
                      </span>
                      <div className="min-w-0 flex-1 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold tabular-nums text-slate-900">
                              {u.score}/{u.wickets} <span className="font-normal text-slate-500">({u.overs} ov)</span>
                            </span>
                            {rr !== null && <Badge tone="gray">RR {rr.toFixed(2)}</Badge>}
                            <StatusBadge status={u.status} />
                          </div>
                          <span className="text-xs text-slate-400">{formatTime(u.timestamp)} · {formatDate(u.timestamp)}</span>
                        </div>
                        {u.notes && <p className="mt-1.5 text-sm text-slate-600">{u.notes}</p>}
                        {u.runRateNote && <p className="mt-1 text-xs italic text-slate-500">Run-rate note: {u.runRateNote}</p>}
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>by {author?.role === 'admin' ? 'Admin' : author?.name || 'Unknown'}</span>
                            {u.relatedRecordId && (
                              <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-1.5 py-0.5 font-medium text-indigo-700">
                                <Link2 className="h-3 w-3" /> {u.relatedRecordId}
                              </span>
                            )}
                          </div>
                          {canModify(u) && (
                            <div className="flex gap-1">
                              <Button size="xs" variant="ghost" icon={Edit3} onClick={() => setEditing({ ...u, timestamp: toDateTimeInput(u.timestamp) })}>
                                Edit
                              </Button>
                              <Button size="xs" variant="ghost" icon={Trash2} className="text-red-600 hover:bg-red-50" onClick={() => setToDelete(u)}>
                                Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <EmptyState icon={Radio} title="No observations yet" message="Add the first manual update using the form." />
            )}
          </Card>
        </div>

        {/* Update form + related records */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Add manual update" subtitle="Values are validated before saving" icon={Plus} />
            <form onSubmit={submit} className="space-y-3 p-5" noValidate>
              <Field label="Batting team" required error={errors.battingTeam}>
                <Select value={form.battingTeam} onChange={set('battingTeam')} options={[{ value: match.teamA.short, label: match.teamA.name }, { value: match.teamB.short, label: match.teamB.name }]} />
              </Field>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Score" required error={errors.score}>
                  <Input inputMode="numeric" value={form.score} onChange={set('score')} error={errors.score} placeholder="121" />
                </Field>
                <Field label="Wickets" required error={errors.wickets}>
                  <Input inputMode="numeric" value={form.wickets} onChange={set('wickets')} error={errors.wickets} placeholder="3" />
                </Field>
                <Field label="Overs" required error={errors.overs}>
                  <Input inputMode="decimal" value={form.overs} onChange={set('overs')} error={errors.overs} placeholder="14.3" />
                </Field>
              </div>
              {form.score && form.overs && runRate(form.score, form.overs) !== null && (
                <p className="text-xs text-slate-500">
                  Calculated run rate: <strong>{runRate(form.score, form.overs).toFixed(2)}</strong>
                </p>
              )}
              <Field label="Run-rate observation (optional)">
                <Input value={form.runRateNote} onChange={set('runRateNote')} placeholder="e.g. Slowed after spin introduced" />
              </Field>
              <Field label="Match status">
                <Select value={form.status} onChange={set('status')} options={STATUSES} />
              </Field>
              <Field label="Observation notes">
                <Textarea value={form.notes} onChange={set('notes')} placeholder="What did you observe?" />
              </Field>
              <Field label="Related strategy record" hint={!recordOptions.length ? 'No strategy records for this match yet.' : undefined}>
                <Select value={form.relatedRecordId} onChange={set('relatedRecordId')} placeholder="None" options={recordOptions} />
              </Field>
              <Field label="Update timestamp" required error={errors.timestamp}>
                <Input type="datetime-local" value={form.timestamp} onChange={set('timestamp')} error={errors.timestamp} />
              </Field>
              <Button type="submit" className="w-full" icon={Plus}>
                Save update
              </Button>
            </form>
          </Card>

          <Card>
            <CardHeader title="Related strategy records" subtitle={`${relatedRecords.length} record(s) for this match`} icon={Link2} />
            {relatedRecords.length ? (
              <ul className="divide-y divide-slate-100">
                {relatedRecords.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {r.id} · {r.configName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {r.decision} · {formatDateTime(r.entryAt)}
                        {admin && ` · ${data.userById(r.userId)?.name}`}
                      </p>
                    </div>
                    <StatusBadge status={r.evaluation.outcome} className="hidden sm:inline-flex" />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No linked records" message="Record a Right Entry decision for this match to link it here." className="py-8" />
            )}
            {!admin && (
              <div className="border-t border-slate-100 p-3">
                <Link to={`/user/strategies/right-entry?match=${matchId}`}>
                  <Button variant="soft" size="sm" className="w-full">Do an Entry Check for this match</Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Edit update modal */}
      <Modal
        open={Boolean(editing)}
        onClose={() => {
          setEditing(null);
          setErrors({});
        }}
        title={`Edit observation ${editing?.id || ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveEdit}>Save changes</Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {['score', 'wickets', 'overs'].map((k) => (
                <Field key={k} label={k[0].toUpperCase() + k.slice(1)} error={errors[k]}>
                  <Input value={editing[k]} onChange={(e) => setEditing({ ...editing, [k]: e.target.value })} error={errors[k]} />
                </Field>
              ))}
            </div>
            <Field label="Status">
              <Select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} options={STATUSES} />
            </Field>
            <Field label="Notes">
              <Textarea value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
            </Field>
            <Field label="Timestamp" error={errors.timestamp}>
              <Input type="datetime-local" value={editing.timestamp} onChange={(e) => setEditing({ ...editing, timestamp: e.target.value })} />
            </Field>
          </div>
        )}
      </Modal>

      {/* Admin: edit match info */}
      <Modal
        open={Boolean(matchEdit)}
        onClose={() => setMatchEdit(null)}
        title={`Edit ${matchTitle(match)} (demo data)`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setMatchEdit(null)}>Cancel</Button>
            <Button
              onClick={() => {
                data.updateMatch(match.id, matchEdit);
                setMatchEdit(null);
                toast('Match information updated for all users.', 'success');
              }}
            >
              Save
            </Button>
          </>
        }
      >
        {matchEdit && (
          <div className="space-y-3">
            <Field label="Status">
              <Select value={matchEdit.status} onChange={(e) => setMatchEdit({ ...matchEdit, status: e.target.value })} options={STATUSES} />
            </Field>
            <Field label="Result text (fictional)">
              <Input value={matchEdit.result} onChange={(e) => setMatchEdit({ ...matchEdit, result: e.target.value })} placeholder="e.g. Coastal Kings won by 5 runs (demo)" />
            </Field>
            <Field label="Informational strategy notes">
              <Textarea value={matchEdit.notes} onChange={(e) => setMatchEdit({ ...matchEdit, notes: e.target.value })} />
            </Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          data.deleteMatchUpdate(toDelete.id);
          toast('Observation deleted.', 'info');
        }}
        title="Delete observation?"
        message={`This removes ${toDelete?.id} from the timeline. This cannot be undone in this demo session.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
