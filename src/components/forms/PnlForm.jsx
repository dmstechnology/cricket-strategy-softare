import { useMemo, useState } from 'react';
import { Calculator, Info, Save, Target } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { Alert, Button, Card, CardHeader, Field, Input, Money, Select, Textarea, cx, useToast } from '../ui';
import { PNL_METHODS, TARGET_RULES, calculatePnl, matchTitle, targetReached } from '../../utils/calculations';
import { formatAmount, toDateTimeInput } from '../../utils/formatters';
import { isValidNumber } from '../../utils/validation';

const EXIT_REASONS = [
  'Target reached',
  'Stop level reached',
  'Manual exit',
  'Manual exit before target',
  'Momentum shift',
  'Match ended',
  'Match abandoned (no result)',
  'Other',
];

export function blankPnl(defaults = {}) {
  return {
    method: 'simple',
    recordId: '',
    matchId: '',
    strategyKey: 'right-entry',
    entryValue: '',
    exitValue: '',
    positionSize: '',
    recordedGain: '',
    costs: '',
    targetValue: '',
    exitReason: '',
    exitAt: toDateTimeInput(),
    notes: '',
    ...defaults,
  };
}

/**
 * Shared form for the P&L Calculator and the Book Profit workflow.
 * mode = 'pnl' | 'book-profit'
 */
export default function PnlForm({ userId, mode = 'pnl', initial, editingId, onSaved, onCancel }) {
  const data = useAppData();
  const toast = useToast();
  const [form, setForm] = useState(() => initial || blankPnl());
  const [errors, setErrors] = useState({});
  const bookProfit = mode === 'book-profit';
  const targetRule = data.coreStrategies.find((s) => s.key === 'book-profit')?.config?.targetRule || 'net';

  const entryRecords = data.entryRecords.filter((r) => r.userId === userId);
  const calc = useMemo(() => calculatePnl(form), [form]);
  const reached = targetReached({ ...form, gross: calc.gross, net: calc.net }, targetRule);

  const set = (k) => (e) => {
    const v = e.target.value;
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === 'recordId' && v) {
        const r = data.entryRecords.find((x) => x.id === v);
        if (r) next.matchId = r.matchId;
      }
      return next;
    });
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const save = (ev) => {
    ev.preventDefault();
    const e = { ...calc.errors };
    if (!form.matchId) e.matchId = 'Select the match.';
    if (bookProfit && !form.recordId) e.recordId = 'Select the related entry record.';
    if (bookProfit && !isValidNumber(form.targetValue)) e.targetValue = 'Set a target value.';
    if (form.targetValue !== '' && !isValidNumber(form.targetValue)) e.targetValue = 'Must be a number.';
    if (!form.exitAt) e.exitAt = 'Exit timestamp is required.';
    if (calc.complete && !form.exitReason) e.exitReason = 'Record why the record was closed.';
    if (bookProfit && !calc.complete) {
      calc.missing.forEach((m) => {
        e[m] = 'Required to complete the record.';
      });
    }
    setErrors(e);
    if (Object.keys(e).length) return;

    const payload = {
      userId,
      recordId: form.recordId,
      matchId: form.matchId,
      strategyKey: form.strategyKey,
      method: form.method,
      entryValue: form.entryValue,
      exitValue: form.exitValue,
      positionSize: form.positionSize,
      recordedGain: form.recordedGain,
      costs: calc.costs,
      gross: calc.gross,
      net: calc.net,
      targetValue: form.targetValue,
      exitReason: form.exitReason,
      notes: form.notes.trim(),
      status: calc.complete ? 'Completed' : 'Open',
      source: bookProfit ? 'book-profit' : initial?.source || 'pnl',
      exitAt: new Date(form.exitAt).toISOString(),
    };
    const res = editingId ? data.updatePnlRecord(editingId, payload) : data.addPnlRecord(payload);
    const id = editingId || res.id;
    toast(
      calc.complete ? `${id} saved with net result ${formatAmount(calc.net, { sign: true })} (simulated).` : `${id} saved as an open record — the result will be calculated once inputs are complete.`,
      'success',
      editingId ? 'Record updated' : 'Record saved'
    );
    (res?.newAlerts || []).forEach((a) =>
      toast(
        a.isCount ? `${a.amount} records this session (limit ${a.limit}).` : `${formatAmount(a.amount)} vs limit ${formatAmount(a.limit)}. See Strict Loss-Cut.`,
        a.level === 'Limit Exceeded' ? 'danger' : 'warning',
        `${a.scope}: ${a.level}`
      )
    );
    setForm(blankPnl({ method: form.method }));
    onSaved?.(id);
  };

  const methodInfo = PNL_METHODS[form.method];

  return (
    <form onSubmit={save} noValidate className="grid gap-6 xl:grid-cols-5">
      <Card className="xl:col-span-3">
        <CardHeader
          title={bookProfit ? (editingId ? `Edit ${editingId}` : 'Record exit & outcome') : editingId ? `Edit ${editingId}` : 'New P&L record'}
          subtitle={bookProfit ? 'Record the planned target and the final hypothetical outcome.' : 'Calculated automatically from valid demo inputs.'}
          icon={bookProfit ? Target : Calculator}
        />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Related entry record" required={bookProfit} error={errors.recordId}>
            <Select
              value={form.recordId}
              onChange={set('recordId')}
              error={errors.recordId}
              placeholder="None"
              options={entryRecords.map((r) => ({ value: r.id, label: `${r.id} · ${matchTitle(data.matchById(r.matchId))} · ${r.decision}${r.status === 'Open' ? ' (open)' : ''}` }))}
            />
          </Field>
          <Field label="Match" required error={errors.matchId}>
            <Select value={form.matchId} onChange={set('matchId')} error={errors.matchId} placeholder="Select match" options={data.matches.map((m) => ({ value: m.id, label: `${m.id} · ${matchTitle(m)}` }))} />
          </Field>
          <Field label="Strategy">
            <Select value={form.strategyKey} onChange={set('strategyKey')} options={[{ value: 'right-entry', label: 'Right Entry' }, { value: 'live-tracking', label: 'Live Trading / Match Tracking' }]} />
          </Field>
          <Field label="Calculation method">
            <Select value={form.method} onChange={set('method')} options={Object.values(PNL_METHODS).map((m) => ({ value: m.key, label: m.name }))} />
          </Field>

          {form.method === 'illustrative' ? (
            <>
              <Field label="Entry value (illustrative)" error={errors.entryValue}>
                <Input inputMode="decimal" value={form.entryValue} onChange={set('entryValue')} error={errors.entryValue} placeholder="1.80" />
              </Field>
              <Field label="Exit value (illustrative)" error={errors.exitValue}>
                <Input inputMode="decimal" value={form.exitValue} onChange={set('exitValue')} error={errors.exitValue} placeholder="2.30" />
              </Field>
              <Field label="Demo position size" error={errors.positionSize}>
                <Input inputMode="decimal" value={form.positionSize} onChange={set('positionSize')} error={errors.positionSize} placeholder="1000" />
              </Field>
            </>
          ) : (
            <Field label="Recorded gain / loss" error={errors.recordedGain} hint="Use a minus sign for a loss, e.g. -450" className="sm:col-span-1">
              <Input inputMode="decimal" value={form.recordedGain} onChange={set('recordedGain')} error={errors.recordedGain} placeholder="e.g. 1250 or -430" />
            </Field>
          )}
          <Field label="Recorded costs" error={errors.costs} hint="Optional, defaults to 0">
            <Input inputMode="decimal" value={form.costs} onChange={set('costs')} error={errors.costs} placeholder="0" />
          </Field>
          <Field label={bookProfit ? 'Target amount' : 'Target value (optional)'} required={bookProfit} error={errors.targetValue} hint={TARGET_RULES[targetRule]}>
            <Input inputMode="decimal" value={form.targetValue} onChange={set('targetValue')} error={errors.targetValue} placeholder="e.g. 1000" />
          </Field>
          <Field label="Exit timestamp" required error={errors.exitAt}>
            <Input type="datetime-local" value={form.exitAt} onChange={set('exitAt')} error={errors.exitAt} />
          </Field>
          <Field label="Exit reason" error={errors.exitReason}>
            <Select value={form.exitReason} onChange={set('exitReason')} error={errors.exitReason} placeholder="Select reason" options={EXIT_REASONS} />
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <Textarea value={form.notes} onChange={set('notes')} placeholder="Why did you close this record?" />
          </Field>
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <Button variant="secondary" onClick={() => { setForm(blankPnl()); setErrors({}); onCancel?.(); }}>
            {editingId ? 'Cancel edit' : 'Reset'}
          </Button>
          <Button type="submit" icon={Save}>{editingId ? 'Update record' : calc.complete ? 'Save completed record' : 'Save as open record'}</Button>
        </div>
      </Card>

      <div className="space-y-4 xl:col-span-2">
        <Card className="overflow-hidden">
          <div className={cx('p-5 text-white', calc.complete ? (calc.net > 0 ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' : calc.net < 0 ? 'bg-gradient-to-br from-red-500 to-red-700' : 'bg-gradient-to-br from-slate-500 to-slate-700') : 'bg-gradient-to-br from-slate-400 to-slate-500')}>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Net result (simulated)</p>
            <p className="mt-1 text-3xl font-extrabold tabular-nums">{calc.complete ? formatAmount(calc.net, { sign: true }) : 'Incomplete'}</p>
            <p className="mt-1 text-sm opacity-90">
              {calc.complete ? (calc.net > 0 ? 'Positive result' : calc.net < 0 ? 'Negative result' : 'Zero result') : 'Enter the required values to calculate.'}
            </p>
          </div>
          <dl className="divide-y divide-slate-100 text-sm">
            <div className="flex justify-between px-5 py-2.5"><dt className="text-slate-500">Gross result</dt><dd><Money value={calc.gross} /></dd></div>
            <div className="flex justify-between px-5 py-2.5"><dt className="text-slate-500">Recorded costs</dt><dd className="font-semibold tabular-nums text-slate-700">−{formatAmount(calc.costs)}</dd></div>
            <div className="flex justify-between px-5 py-2.5"><dt className="font-semibold text-slate-700">Net result</dt><dd><Money value={calc.net} /></dd></div>
            {isValidNumber(form.targetValue) && (
              <div className="flex items-center justify-between px-5 py-2.5">
                <dt className="text-slate-500">Target {formatAmount(Number(form.targetValue))}</dt>
                <dd>
                  {reached === null ? (
                    <span className="text-slate-400">—</span>
                  ) : reached ? (
                    <span className="font-semibold text-emerald-600">Target reached</span>
                  ) : (
                    <span className="font-semibold text-amber-600">Target not reached</span>
                  )}
                </dd>
              </div>
            )}
          </dl>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Info className="h-4 w-4 text-indigo-500" /> Formula used
          </div>
          <p className="mt-2 rounded-lg bg-slate-900 px-3 py-2 font-mono text-xs text-emerald-300">{methodInfo.formula}</p>
          <p className="mt-2 text-xs text-slate-500">{methodInfo.description}</p>
          {!calc.complete && calc.missing.length > 0 && (
            <p className="mt-2 text-xs text-amber-700">Missing: {calc.missing.join(', ')} — no result is calculated for incomplete records.</p>
          )}
        </Card>
        <Alert type="demo" title="Hypothetical values only">
          All results are demonstration figures — not actual earnings or financial advice. Recording an exit never places, settles or closes a real bet.
        </Alert>
      </div>
    </form>
  );
}
