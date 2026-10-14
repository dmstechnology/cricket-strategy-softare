import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CheckCircle2, CircleHelp, ClipboardList, Copy, Crosshair, Edit3, Eye, ListChecks, Percent, Plus, Save, Settings2,
  Trash2, XCircle, BarChart3,
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import {
  Alert, Badge, Button, Card, CardHeader, Checkbox, ConfirmDialog, DataTable, EmptyState, Field, Input, KeyValue, Modal,
  PageHeader, Select, StatCard, StatusBadge, Tabs, Textarea, useToast, cx,
} from '../../components/ui';
import { StrategyGate } from '../../routes/guards';
import {
  CONDITION_FIELDS, ENTRY_OUTCOMES, OPERATORS, describeCondition, evaluateEntry, matchTitle, runRate, suggestCompliance,
} from '../../utils/calculations';
import { formatDateTime, formatPercent, toDateTimeInput } from '../../utils/formatters';
import { isValidNumber, isValidOvers } from '../../utils/validation';

const DECISIONS = ['Entry', 'No Entry', 'Manual Review'];
const COMPLIANCE = ['Compliant', 'Partially Compliant', 'Non-Compliant'];

/* ------------------------------------------------------------------ */
/* Configuration editor                                                */
/* ------------------------------------------------------------------ */

export const blankConfig = (userId) => ({
  userId,
  name: '',
  matchId: '',
  format: 'T20',
  requiredSituation: '',
  conditions: [
    { id: 'c1', type: 'numeric', field: 'overs', operator: 'between', value: 4, value2: 6, required: true },
    { id: 'c2', type: 'checklist', label: 'Pitch report reviewed', required: true },
  ],
  notes: '',
  status: 'Active',
});

export function ConfigEditor({ open, initial, onClose, onSave, matches }) {
  const [cfg, setCfg] = useState(initial);
  const [error, setError] = useState('');
  if (!open || !cfg) return null;

  const setC = (i, changes) => setCfg((c) => ({ ...c, conditions: c.conditions.map((x, j) => (j === i ? { ...x, ...changes } : x)) }));
  const addCondition = (type) =>
    setCfg((c) => ({
      ...c,
      conditions: [
        ...c.conditions,
        type === 'checklist'
          ? { id: `c${Date.now()}`, type, label: '', required: true }
          : { id: `c${Date.now()}`, type, field: 'wickets', operator: 'lte', value: '', value2: '', required: true },
      ],
    }));

  const save = () => {
    if (!cfg.name.trim()) return setError('Strategy name is required.');
    if (!cfg.conditions.length) return setError('Add at least one condition.');
    for (const c of cfg.conditions) {
      if (c.type === 'checklist' && !c.label.trim()) return setError('Every checklist item needs a label.');
      if (c.type === 'numeric') {
        if (!isValidNumber(c.value)) return setError(`Enter a numeric value for "${CONDITION_FIELDS[c.field]}".`);
        if (c.operator === 'between' && !isValidNumber(c.value2)) return setError(`Enter both values for the "between" rule on "${CONDITION_FIELDS[c.field]}".`);
      }
    }
    onSave({
      ...cfg,
      name: cfg.name.trim(),
      conditions: cfg.conditions.map((c) =>
        c.type === 'numeric' ? { ...c, value: Number(c.value), value2: c.operator === 'between' ? Number(c.value2) : undefined } : c
      ),
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={cfg.id ? `Edit configuration ${cfg.id}` : 'New Right Entry configuration'}
      subtitle="Rules are editable sample conditions — replace them with the client's approved methodology."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button icon={Save} onClick={save}>Save configuration</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert type="danger">{error}</Alert>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Strategy name" required>
            <Input value={cfg.name} onChange={(e) => setCfg({ ...cfg, name: e.target.value })} placeholder="e.g. Powerplay Stability Check" />
          </Field>
          <Field label="Status">
            <Select value={cfg.status} onChange={(e) => setCfg({ ...cfg, status: e.target.value })} options={['Active', 'Draft', 'Archived']} />
          </Field>
          <Field label="Match (optional)" hint="Leave empty to use with any match.">
            <Select value={cfg.matchId || ''} onChange={(e) => setCfg({ ...cfg, matchId: e.target.value })} placeholder="Any match" options={matches.map((m) => ({ value: m.id, label: `${m.id} · ${matchTitle(m)}` }))} />
          </Field>
          <Field label="Format">
            <Select value={cfg.format} onChange={(e) => setCfg({ ...cfg, format: e.target.value })} options={['T20', 'ODI', 'Test', 'Any']} />
          </Field>
        </div>
        <Field label="Required match situation">
          <Input value={cfg.requiredSituation} onChange={(e) => setCfg({ ...cfg, requiredSituation: e.target.value })} placeholder="Describe the situation in which this rule applies" />
        </Field>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="label mb-0">Entry conditions</p>
            <div className="flex gap-2">
              <Button size="xs" variant="soft" icon={Plus} onClick={() => addCondition('numeric')}>Numeric rule</Button>
              <Button size="xs" variant="soft" icon={Plus} onClick={() => addCondition('checklist')}>Checklist item</Button>
            </div>
          </div>
          <div className="space-y-2">
            {cfg.conditions.map((c, i) => (
              <div key={c.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-2.5">
                <Badge tone={c.type === 'checklist' ? 'violet' : 'blue'}>{c.type === 'checklist' ? 'Checklist' : 'Numeric'}</Badge>
                {c.type === 'checklist' ? (
                  <Input className="min-w-[200px] flex-1" value={c.label} onChange={(e) => setC(i, { label: e.target.value })} placeholder="Checklist item, e.g. Toss result noted" />
                ) : (
                  <>
                    <Select className="w-auto min-w-[170px] flex-1" value={c.field} onChange={(e) => setC(i, { field: e.target.value })} options={Object.entries(CONDITION_FIELDS).map(([value, label]) => ({ value, label }))} />
                    <Select className="w-28" value={c.operator} onChange={(e) => setC(i, { operator: e.target.value })} options={Object.entries(OPERATORS).map(([value, label]) => ({ value, label }))} />
                    <Input className="w-24" inputMode="decimal" value={c.value} onChange={(e) => setC(i, { value: e.target.value })} placeholder="Value" />
                    {c.operator === 'between' && (
                      <>
                        <span className="text-xs text-slate-500">and</span>
                        <Input className="w-24" inputMode="decimal" value={c.value2 ?? ''} onChange={(e) => setC(i, { value2: e.target.value })} placeholder="Value" />
                      </>
                    )}
                  </>
                )}
                <Checkbox label="Required" checked={c.required !== false} onChange={(e) => setC(i, { required: e.target.checked })} />
                <button
                  type="button"
                  onClick={() => setCfg((x) => ({ ...x, conditions: x.conditions.filter((_, j) => j !== i) }))}
                  className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Remove condition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {!cfg.conditions.length && <p className="text-sm text-slate-500">No conditions yet.</p>}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Evaluation: any failed required rule → Not Satisfied; any required rule with missing input → Manual Review Required;
            otherwise Satisfied. Optional rules are displayed but never change the outcome.
          </p>
        </div>
        <Field label="Custom rules & strategy notes">
          <Textarea value={cfg.notes} onChange={(e) => setCfg({ ...cfg, notes: e.target.value })} rows={3} />
        </Field>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Evaluation panel                                                    */
/* ------------------------------------------------------------------ */

function EvaluationPanel({ evaluation }) {
  const tone = {
    [ENTRY_OUTCOMES.SATISFIED]: 'from-emerald-500 to-emerald-600',
    [ENTRY_OUTCOMES.NOT_SATISFIED]: 'from-red-500 to-red-600',
    [ENTRY_OUTCOMES.REVIEW]: 'from-amber-500 to-amber-600',
  }[evaluation.outcome];
  return (
    <Card className="overflow-hidden">
      <div className={cx('bg-gradient-to-br p-5 text-white', tone)}>
        <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Result</p>
        <p className="mt-1 text-xl font-bold">{evaluation.outcome}</p>
        <p className="mt-1 text-sm opacity-90">
          {evaluation.passedCount} of {evaluation.total} conditions satisfied ({evaluation.score}%)
        </p>
      </div>
      <ul className="divide-y divide-slate-100">
        {evaluation.results.map((r) => (
          <li key={r.id} className="flex items-start gap-3 px-5 py-3">
            {r.passed === true ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            ) : r.passed === false ? (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            ) : (
              <CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-800">{r.label}</p>
              <p className="text-xs text-slate-500">
                {r.passed === null ? 'Input missing' : `Entered: ${typeof r.actual === 'number' ? Number(r.actual.toFixed(2)) : r.actual}`}
                {!r.required && ' · optional'}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <p className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400">
        This evaluation only compares manually entered values with your configured demo rules. It does not predict or guarantee any
        outcome and never places a bet.
      </p>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function blankEntry(configId, matchId) {
  return {
    configId,
    matchId,
    team: '',
    entryAt: toDateTimeInput(),
    score: '',
    overs: '',
    wickets: '',
    oddsRef: '',
    checklist: {},
    notes: '',
    decision: 'Entry',
    compliance: '',
    reason: '',
  };
}

export default function RightEntryPage() {
  return (
    <>
      <PageHeader
        title="Entry Check"
        description="Enter the match score and we tell you if your rules are met. Then save your decision."
        
      />
      <StrategyGate strategyKey="right-entry">
        <RightEntryContent />
      </StrategyGate>
    </>
  );
}

function RightEntryContent() {
  const data = useAppData();
  const { user } = useAuth();
  const toast = useToast();
  const [params] = useSearchParams();
  const [tab, setTab] = useState('record');

  const configs = data.entryConfigs.filter((c) => c.userId === null || c.userId === user.id);
  const usable = configs.filter((c) => c.status !== 'Archived');
  const myRecords = data.entryRecords.filter((r) => r.userId === user.id);
  const selectableMatches = data.matches.filter((m) => m.status !== 'Abandoned');

  const defaultMatch = params.get('match') || data.matches.find((m) => m.status === 'In Progress')?.id || data.matches[0]?.id || '';
  const [form, setForm] = useState(() => blankEntry(usable[0]?.id || '', defaultMatch));
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [editorCfg, setEditorCfg] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [histFilter, setHistFilter] = useState({ matchId: '', outcome: '' });

  const config = data.entryConfigs.find((c) => c.id === form.configId);
  const match = data.matchById(form.matchId);
  const evaluation = useMemo(() => evaluateEntry(config, form), [config, form]);
  const suggested = suggestCompliance(evaluation.outcome, form.decision);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.configId) e.configId = 'Select a configuration.';
    if (!form.matchId) e.matchId = 'Select a match.';
    if (!form.entryAt) e.entryAt = 'Entry date and time are required.';
    if (form.score !== '' && (!isValidNumber(form.score) || Number(form.score) < 0)) e.score = 'Runs must be 0 or more.';
    if (form.wickets !== '' && (!isValidNumber(form.wickets) || Number(form.wickets) < 0 || Number(form.wickets) > 10)) e.wickets = '0–10 only.';
    if (form.overs !== '' && !isValidOvers(form.overs)) e.overs = 'Use overs like 5.3 (0–5 balls).';
    if (form.oddsRef !== '' && !isValidNumber(form.oddsRef)) e.oddsRef = 'Must be a number.';
    if (!form.reason.trim()) e.reason = 'Explain the reason for this decision.';
    return e;
  };

  const save = (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    const payload = {
      userId: user.id,
      configId: form.configId,
      configName: config.name,
      matchId: form.matchId,
      team: form.team,
      entryAt: new Date(form.entryAt).toISOString(),
      score: form.score === '' ? '' : Number(form.score),
      wickets: form.wickets === '' ? '' : Number(form.wickets),
      overs: form.overs === '' ? '' : Number(form.overs),
      oddsRef: form.oddsRef,
      checklist: form.checklist,
      evaluation,
      decision: form.decision,
      compliance: form.compliance || suggested,
      reason: form.reason.trim(),
      notes: form.notes.trim(),
    };
    if (editingId) {
      data.updateEntryRecord(editingId, payload);
      toast(`Record ${editingId} updated.`, 'success', 'Strategy record saved');
    } else {
      const id = data.addEntryRecord({ ...payload, status: form.decision === 'Entry' ? 'Open' : form.decision === 'No Entry' ? 'Closed' : 'Open' });
      toast(`${id}: ${evaluation.outcome}. Saved to your strategy history.`, 'success', 'Strategy record saved');
    }
    setEditingId(null);
    setForm(blankEntry(form.configId, form.matchId));
  };

  const startEdit = (r) => {
    setEditingId(r.id);
    setForm({
      configId: r.configId,
      matchId: r.matchId,
      team: r.team || '',
      entryAt: toDateTimeInput(r.entryAt),
      score: r.score,
      overs: r.overs,
      wickets: r.wickets,
      oddsRef: r.oddsRef || '',
      checklist: r.checklist || {},
      notes: r.notes || '',
      decision: r.decision,
      compliance: r.compliance,
      reason: r.reason || '',
    });
    setErrors({});
    setViewRecord(null);
    setTab('record');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveConfig = (cfg) => {
    if (cfg.id) {
      data.updateEntryConfig(cfg.id, cfg);
      toast(`Configuration "${cfg.name}" updated.`);
    } else {
      const id = data.addEntryConfig(cfg);
      setForm((f) => ({ ...f, configId: id }));
      toast(`Configuration "${cfg.name}" created.`);
    }
    setEditorCfg(null);
  };

  // Analytics
  const counts = {
    total: myRecords.length,
    satisfied: myRecords.filter((r) => r.evaluation.outcome === ENTRY_OUTCOMES.SATISFIED).length,
    notSatisfied: myRecords.filter((r) => r.evaluation.outcome === ENTRY_OUTCOMES.NOT_SATISFIED).length,
    compliant: myRecords.filter((r) => r.compliance === 'Compliant').length,
  };
  const complianceRate = counts.total ? (counts.compliant / counts.total) * 100 : null;
  const byMatch = Object.values(
    myRecords.reduce((acc, r) => {
      const cur = acc[r.matchId] || { matchId: r.matchId, total: 0, satisfied: 0, notSatisfied: 0, entries: 0, compliant: 0 };
      cur.total += 1;
      if (r.evaluation.outcome === ENTRY_OUTCOMES.SATISFIED) cur.satisfied += 1;
      if (r.evaluation.outcome === ENTRY_OUTCOMES.NOT_SATISFIED) cur.notSatisfied += 1;
      if (r.decision === 'Entry') cur.entries += 1;
      if (r.compliance === 'Compliant') cur.compliant += 1;
      acc[r.matchId] = cur;
      return acc;
    }, {})
  );

  const history = myRecords
    .filter((r) => !histFilter.matchId || r.matchId === histFilter.matchId)
    .filter((r) => !histFilter.outcome || r.evaluation.outcome === histFilter.outcome);

  const checklistItems = config?.conditions.filter((c) => c.type === 'checklist') || [];
  const crr = runRate(form.score, form.overs);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total checks" value={counts.total} icon={ClipboardList} tone="indigo" />
        <StatCard label="Rules met" value={counts.satisfied} icon={CheckCircle2} tone="green" />
        <StatCard label="Rules not met" value={counts.notSatisfied} icon={XCircle} tone="red" />
        <StatCard label="Followed my rules" value={formatPercent(complianceRate)} icon={Percent} tone="violet" hint={`${counts.compliant} compliant decisions`} />
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'record', label: editingId ? `Editing ${editingId}` : 'New check' },
          { value: 'configs', label: 'My rules', count: configs.length },
          { value: 'history', label: 'History', count: myRecords.length },
          { value: 'analytics', label: 'Summary' },
        ]}
        className="w-fit max-w-full"
      />

      {tab === 'record' && (
        <form onSubmit={save} noValidate className="grid gap-6 xl:grid-cols-5">
          <div className="space-y-6 xl:col-span-3">
            {editingId && (
              <Alert type="info" title={`Editing record ${editingId}`} action={<Button size="sm" variant="secondary" onClick={() => { setEditingId(null); setForm(blankEntry(form.configId, form.matchId)); }}>Cancel edit</Button>}>
                Saving will re-evaluate the record against the current configuration.
              </Alert>
            )}
            <Card>
              <CardHeader title="1. Pick your rules and match" icon={Crosshair} />
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <Field label="My rules" required error={errors.configId}>
                  <Select value={form.configId} onChange={set('configId')} error={errors.configId} placeholder="Select configuration" options={usable.map((c) => ({ value: c.id, label: `${c.name}${c.userId ? '' : ' (template)'}${c.status === 'Draft' ? ' — draft' : ''}` }))} />
                </Field>
                <Field label="Match" required error={errors.matchId}>
                  <Select value={form.matchId} onChange={set('matchId')} error={errors.matchId} placeholder="Select match" options={selectableMatches.map((m) => ({ value: m.id, label: `${m.id} · ${matchTitle(m)} (${m.status})` }))} />
                </Field>
                <Field label="Team (if relevant)">
                  <Select value={form.team} onChange={set('team')} placeholder="Not team-specific" options={match ? [{ value: match.teamA.short, label: match.teamA.name }, { value: match.teamB.short, label: match.teamB.name }] : []} />
                </Field>
                <Field label="Entry date & time" required error={errors.entryAt}>
                  <Input type="datetime-local" value={form.entryAt} onChange={set('entryAt')} error={errors.entryAt} />
                </Field>
                {config && (
                  <div className="rounded-xl bg-indigo-50/60 p-3 text-sm text-indigo-900 sm:col-span-2">
                    <p className="font-semibold">{config.name}</p>
                    {config.requiredSituation && <p className="mt-0.5 text-indigo-800/80">Situation: {config.requiredSituation}</p>}
                    {config.format !== 'Any' && match && config.format !== match.format && (
                      <p className="mt-1 text-xs font-medium text-amber-700">Note: this configuration targets {config.format}, the selected match is {match.format}.</p>
                    )}
                    {config.status === 'Draft' && <p className="mt-1 text-xs font-medium text-amber-700">This configuration is a draft.</p>}
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="2. Enter the match score" subtitle="Leave empty if you do not know it." icon={ListChecks} />
              <div className="grid gap-4 p-5 sm:grid-cols-4">
                <Field label="Current score" error={errors.score}>
                  <Input inputMode="numeric" value={form.score} onChange={set('score')} error={errors.score} placeholder="52" />
                </Field>
                <Field label="Overs completed" error={errors.overs}>
                  <Input inputMode="decimal" value={form.overs} onChange={set('overs')} error={errors.overs} placeholder="6.0" />
                </Field>
                <Field label="Wickets fallen" error={errors.wickets}>
                  <Input inputMode="numeric" value={form.wickets} onChange={set('wickets')} error={errors.wickets} placeholder="1" />
                </Field>
                <Field label="Manual price ref." error={errors.oddsRef} hint="Optional illustrative note">
                  <Input inputMode="decimal" value={form.oddsRef} onChange={set('oddsRef')} error={errors.oddsRef} placeholder="e.g. 1.85" />
                </Field>
                <p className="text-xs text-slate-500 sm:col-span-4">
                  Calculated run rate: <strong>{crr === null ? '—' : crr.toFixed(2)}</strong>. The price reference is a personal note only — it is not market data and is not connected to any exchange.
                </p>
              </div>
              {checklistItems.length > 0 && (
                <div className="border-t border-slate-100 p-5">
                  <p className="label">Checklist</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {checklistItems.map((c) => (
                      <Checkbox
                        key={c.id}
                        label={c.label}
                        description={c.required !== false ? 'Required' : 'Optional'}
                        checked={Boolean(form.checklist[c.id])}
                        onChange={(e) => setForm((f) => ({ ...f, checklist: { ...f.checklist, [c.id]: e.target.checked } }))}
                        className="rounded-lg border border-slate-200 p-3"
                      />
                    ))}
                  </div>
                </div>
              )}
              <div className="border-t border-slate-100 p-5">
                <Field label="Observation notes">
                  <Textarea value={form.notes} onChange={set('notes')} placeholder="What did you observe in the match?" />
                </Field>
              </div>
            </Card>

            <Card>
              <CardHeader title="3. Your decision" icon={Save} />
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <Field label="Decision">
                  <div className="grid grid-cols-3 gap-2">
                    {DECISIONS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, decision: d, compliance: '' }))}
                        className={cx(
                          'rounded-lg border px-2 py-2 text-xs font-semibold transition sm:text-sm',
                          form.decision === d ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Did you follow your rules?" hint={`We suggest: ${suggested}`}>
                  <Select value={form.compliance || suggested} onChange={set('compliance')} options={COMPLIANCE} />
                </Field>
                <Field label="Why?" required error={errors.reason} className="sm:col-span-2">
                  <Textarea value={form.reason} onChange={set('reason')} error={errors.reason} placeholder="Why did you make this decision?" />
                </Field>
                {form.decision === 'Entry' && evaluation.outcome !== ENTRY_OUTCOMES.SATISFIED && (
                  <Alert type="warning" className="sm:col-span-2">
                    You are recording an Entry while the configured conditions are <strong>{evaluation.outcome.toLowerCase()}</strong>. This will be flagged as a rule-compliance issue.
                  </Alert>
                )}
              </div>
              <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
                <Button variant="secondary" onClick={() => { setEditingId(null); setForm(blankEntry(form.configId, form.matchId)); setErrors({}); }}>
                  Reset
                </Button>
                <Button type="submit" icon={Save}>{editingId ? 'Update' : 'Save my decision'}</Button>
              </div>
            </Card>
          </div>
          <div className="xl:col-span-2">
            <div className="space-y-4 xl:sticky xl:top-24">
              {config ? <EvaluationPanel evaluation={evaluation} /> : <Card><EmptyState title="Select a configuration" message="The evaluation appears here as you type." /></Card>}
            </div>
          </div>
        </form>
      )}

      {tab === 'configs' && (
        <Card>
          <CardHeader
            title="My rules"
            subtitle="Use a ready-made rule set or make your own."
            icon={Settings2}
            action={<Button size="sm" icon={Plus} onClick={() => setEditorCfg(blankConfig(user.id))}>New rule set</Button>}
          />
          <div className="grid gap-4 p-5 lg:grid-cols-2">
            {configs.map((c) => {
              const mineCfg = c.userId === user.id;
              return (
                <div key={c.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{c.name}</p>
                      <p className="text-xs text-slate-500">
                        {c.id} · {c.format} · {mineCfg ? 'Your configuration' : 'Admin template'}
                        {c.matchId && ` · ${c.matchId}`}
                      </p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                  {c.requiredSituation && <p className="mt-2 text-sm text-slate-600">{c.requiredSituation}</p>}
                  <ul className="mt-3 space-y-1">
                    {c.conditions.map((cond) => (
                      <li key={cond.id} className="flex items-center gap-2 text-xs text-slate-600">
                        <span className={cx('h-1.5 w-1.5 rounded-full', cond.required !== false ? 'bg-indigo-500' : 'bg-slate-300')} />
                        {describeCondition(cond)}
                        {cond.required === false && <span className="text-slate-400">(optional)</span>}
                      </li>
                    ))}
                  </ul>
                  {c.notes && <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">{c.notes}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {mineCfg ? (
                      <>
                        <Button size="xs" variant="secondary" icon={Edit3} onClick={() => setEditorCfg(c)}>Edit</Button>
                        <Button size="xs" variant="ghost" icon={Trash2} className="text-red-600 hover:bg-red-50" onClick={() => setDeleteTarget({ type: 'config', item: c })}>Delete</Button>
                      </>
                    ) : null}
                    <Button
                      size="xs"
                      variant="ghost"
                      icon={Copy}
                      onClick={() => setEditorCfg({ ...c, id: undefined, userId: user.id, name: `${c.name} (copy)`, status: 'Draft' })}
                    >
                      Duplicate
                    </Button>
                    <Button size="xs" variant="soft" onClick={() => { setForm((f) => ({ ...f, configId: c.id, checklist: {} })); setTab('record'); }} disabled={c.status === 'Archived'}>
                      Use
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {tab === 'history' && (
        <Card>
          <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 p-4">
            <Field label="Match" className="min-w-[200px]">
              <Select value={histFilter.matchId} onChange={(e) => setHistFilter((h) => ({ ...h, matchId: e.target.value }))} placeholder="All matches" options={data.matches.map((m) => ({ value: m.id, label: `${m.id} · ${matchTitle(m)}` }))} />
            </Field>
            <Field label="Outcome" className="min-w-[200px]">
              <Select value={histFilter.outcome} onChange={(e) => setHistFilter((h) => ({ ...h, outcome: e.target.value }))} placeholder="All outcomes" options={Object.values(ENTRY_OUTCOMES)} />
            </Field>
          </div>
          <DataTable
            rows={history}
            initialSort={{ key: 'entryAt', dir: 'desc' }}
            onRowClick={setViewRecord}
            empty={<EmptyState title="No records match" message="Record your first Right Entry decision in the Record entry tab." />}
            columns={[
              { key: 'id', header: 'ID', render: (r) => <span className="font-mono text-xs">{r.id}</span> },
              { key: 'entryAt', header: 'Date', render: (r) => formatDateTime(r.entryAt) },
              { key: 'matchId', header: 'Match', render: (r) => matchTitle(data.matchById(r.matchId)) },
              { key: 'configName', header: 'Configuration' },
              { key: 'outcome', header: 'Evaluation', sortValue: (r) => r.evaluation.outcome, render: (r) => <StatusBadge status={r.evaluation.outcome} /> },
              { key: 'decision', header: 'Decision', render: (r) => <StatusBadge status={r.decision} /> },
              { key: 'compliance', header: 'Compliance', render: (r) => <StatusBadge status={r.compliance} /> },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
              {
                key: 'actions',
                header: '',
                sortable: false,
                render: (r) => (
                  <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button size="xs" variant="ghost" icon={Eye} onClick={() => setViewRecord(r)}>Review</Button>
                    <Button size="xs" variant="ghost" icon={Edit3} onClick={() => startEdit(r)}>Edit</Button>
                  </div>
                ),
              },
            ]}
          />
        </Card>
      )}

      {tab === 'analytics' && (
        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader title="Match-wise history" icon={BarChart3} />
            <DataTable
              rows={byMatch.map((b) => ({ ...b, id: b.matchId }))}
              columns={[
                { key: 'matchId', header: 'Match', render: (b) => `${b.matchId} · ${matchTitle(data.matchById(b.matchId))}` },
                { key: 'total', header: 'Records', align: 'right' },
                { key: 'satisfied', header: 'Satisfied', align: 'right', render: (b) => <span className="text-emerald-600">{b.satisfied}</span> },
                { key: 'notSatisfied', header: 'Not satisfied', align: 'right', render: (b) => <span className="text-red-600">{b.notSatisfied}</span> },
                { key: 'entries', header: 'Entries', align: 'right' },
                { key: 'compliant', header: 'Compliance', align: 'right', sortValue: (b) => b.compliant / b.total, render: (b) => formatPercent((b.compliant / b.total) * 100) },
              ]}
            />
          </Card>
          <Card>
            <CardHeader title="Strategy notes" subtitle="Latest observation notes" icon={ClipboardList} />
            <ul className="divide-y divide-slate-100">
              {myRecords
                .filter((r) => r.notes)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 8)
                .map((r) => (
                  <li key={r.id} className="px-5 py-3">
                    <p className="text-sm text-slate-700">{r.notes}</p>
                    <p className="text-xs text-slate-400">{r.id} · {matchTitle(data.matchById(r.matchId))}</p>
                  </li>
                ))}
            </ul>
          </Card>
        </div>
      )}

      <ConfigEditor
        key={editorCfg?.id || editorCfg?.name || 'new'}
        open={Boolean(editorCfg)}
        initial={editorCfg}
        matches={data.matches}
        onClose={() => setEditorCfg(null)}
        onSave={saveConfig}
      />

      <Modal
        open={Boolean(viewRecord)}
        onClose={() => setViewRecord(null)}
        title={`Strategy record ${viewRecord?.id || ''}`}
        subtitle={viewRecord?.configName}
        size="lg"
        footer={
          <>
            <Button variant="ghost" icon={Trash2} className="mr-auto text-red-600 hover:bg-red-50" onClick={() => setDeleteTarget({ type: 'record', item: viewRecord })}>Delete</Button>
            <Button variant="secondary" onClick={() => setViewRecord(null)}>Close</Button>
            <Button icon={Edit3} onClick={() => startEdit(viewRecord)}>Edit record</Button>
          </>
        }
      >
        {viewRecord && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={viewRecord.evaluation.outcome} />
              <StatusBadge status={viewRecord.decision} />
              <StatusBadge status={viewRecord.compliance} />
              <StatusBadge status={viewRecord.status} />
            </div>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <KeyValue label="Match">{matchTitle(data.matchById(viewRecord.matchId))}</KeyValue>
              <KeyValue label="Team">{viewRecord.team || '—'}</KeyValue>
              <KeyValue label="Entry time">{formatDateTime(viewRecord.entryAt)}</KeyValue>
              <KeyValue label="Score">{viewRecord.score === '' ? '—' : `${viewRecord.score}/${viewRecord.wickets} (${viewRecord.overs})`}</KeyValue>
            </dl>
            <div className="rounded-xl border border-slate-200">
              {viewRecord.evaluation.results.map((r) => (
                <div key={r.id} className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 text-sm last:border-0">
                  {r.passed === true ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : r.passed === false ? <XCircle className="h-4 w-4 text-red-500" /> : <CircleHelp className="h-4 w-4 text-amber-500" />}
                  {r.label}
                </div>
              ))}
            </div>
            <KeyValue label="Reason">{viewRecord.reason || '—'}</KeyValue>
            <KeyValue label="Observation notes">{viewRecord.notes || '—'}</KeyValue>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={deleteTarget?.type === 'config' ? 'Delete configuration?' : 'Delete strategy record?'}
        message={
          deleteTarget?.type === 'config'
            ? `"${deleteTarget?.item.name}" will be removed. Existing records keep their saved evaluation.`
            : `Record ${deleteTarget?.item.id} will be removed from your history and analytics.`
        }
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget.type === 'config') {
            data.deleteEntryConfig(deleteTarget.item.id);
            if (form.configId === deleteTarget.item.id) setForm((f) => ({ ...f, configId: '' }));
          } else {
            data.deleteEntryRecord(deleteTarget.item.id);
            setViewRecord(null);
          }
          toast('Deleted.', 'info');
        }}
      />
    </div>
  );
}
