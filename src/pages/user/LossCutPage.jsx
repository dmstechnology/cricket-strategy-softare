import { useState } from 'react';
import { AlertOctagon, CheckCircle2, MessageSquarePlus, PlayCircle, Save, ShieldAlert, ShieldCheck, TrendingDown } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import {
  Alert, Button, Card, CardHeader, DataTable, EmptyState, Field, Input, KeyValue, Modal, Money, PageHeader,
  ProgressBar, StatCard, StatusBadge, Textarea, Toggle, cx, useToast,
} from '../../components/ui';
import { RiskBreachChart } from '../../components/charts/Charts';
import { StrategyGate } from '../../routes/guards';
import { RISK_STATUS, matchTitle } from '../../utils/calculations';
import { breachSeries } from '../../utils/analytics';
import { formatAmount, formatDateTime } from '../../utils/formatters';
import { isValidNumber } from '../../utils/validation';

const STATUS_STYLE = {
  [RISK_STATUS.OK]: { cls: 'from-emerald-500 to-emerald-700', icon: ShieldCheck, text: 'All monitored results are within your configured demo limits.' },
  [RISK_STATUS.NEAR]: { cls: 'from-amber-500 to-orange-600', icon: AlertOctagon, text: 'At least one metric has reached your "approaching" threshold.' },
  [RISK_STATUS.OVER]: { cls: 'from-red-500 to-red-700', icon: ShieldAlert, text: 'A configured limit has been exceeded. Your rules say to stop recording new entries this session.' },
  [RISK_STATUS.REVIEW]: { cls: 'from-violet-500 to-indigo-700', icon: MessageSquarePlus, text: 'Past limit breaches are missing a review note.' },
};

export default function LossCutPage() {
  return (
    <>
      <PageHeader
        title="Loss Limit"
        description="Decide how much loss is too much. We warn you when you get close."
        
      />
      <StrategyGate strategyKey="loss-cut">
        <LossCutContent />
      </StrategyGate>
    </>
  );
}

function LossCutContent() {
  const data = useAppData();
  const { user } = useAuth();
  const toast = useToast();
  const settings = data.getRiskSettings(user.id);
  const risk = data.getRisk(user.id);
  const [form, setForm] = useState(settings);
  const [errors, setErrors] = useState({});
  const [reviewing, setReviewing] = useState(null);
  const [note, setNote] = useState('');
  const [recordView, setRecordView] = useState(null);

  const setNum = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const save = (ev) => {
    ev.preventDefault();
    const e = {};
    const positive = ['maxLossPerRecord', 'maxRecordsPerSession'];
    if (form.dailyLimitEnabled) positive.push('dailyLossLimit');
    if (form.sessionLimitEnabled) positive.push('sessionLossLimit');
    positive.forEach((k) => {
      if (!isValidNumber(form[k]) || Number(form[k]) <= 0) e[k] = 'Enter a positive number.';
    });
    if (!isValidNumber(form.approachingPct) || Number(form.approachingPct) < 10 || Number(form.approachingPct) > 99) e.approachingPct = 'Use a value between 10 and 99.';
    if (!Number.isInteger(Number(form.maxRecordsPerSession))) e.maxRecordsPerSession = 'Whole number only.';
    setErrors(e);
    if (Object.keys(e).length) return;
    data.updateRiskSettings(user.id, {
      ...form,
      maxLossPerRecord: Number(form.maxLossPerRecord),
      dailyLossLimit: Number(form.dailyLossLimit),
      sessionLossLimit: Number(form.sessionLossLimit),
      maxRecordsPerSession: Number(form.maxRecordsPerSession),
      approachingPct: Number(form.approachingPct),
    });
    toast('Risk limits saved. The dashboard has been re-evaluated.', 'success', 'Settings saved');
  };

  const newSession = () => {
    const start = new Date().toISOString();
    data.updateRiskSettings(user.id, { sessionStart: start });
    setForm((f) => ({ ...f, sessionStart: start }));
    toast('A new demo session has started. Session counters reset.', 'info');
  };

  const saveReview = () => {
    if (!note.trim()) return;
    data.addRiskReview(user.id, reviewing.id, note.trim());
    toast('Review note added to the risk history.', 'success');
    setReviewing(null);
    setNote('');
  };

  const st = STATUS_STYLE[risk.status];
  const StatusIcon = st.icon;
  const pct = Number(settings.approachingPct);
  const unreviewed = risk.alerts.filter((a) => a.level === RISK_STATUS.OVER && !a.review).length;
  const record = recordView && data.pnlRecords.find((r) => r.id === recordView);

  const meters = [
    { label: "Today's recorded loss", value: risk.current.todayLoss, limit: settings.dailyLimitEnabled ? settings.dailyLossLimit : null, remaining: risk.current.dailyRemaining },
    { label: 'Session recorded loss', value: risk.current.sessionLoss, limit: settings.sessionLimitEnabled ? settings.sessionLossLimit : null, remaining: risk.current.sessionRemaining },
    { label: 'Records this session', value: risk.current.sessionCount, limit: settings.maxRecordsPerSession, remaining: risk.current.recordsRemaining, count: true },
  ];

  return (
    <div className="space-y-6">
      <Alert type="warning" title="Warnings cannot stop external transactions">
        These limits only compare your recorded demo results with the thresholds you configure. They cannot block, stop or reverse any
        bet or transaction outside this demo, and there is no automatic betting or loss recovery.
      </Alert>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className={cx('overflow-hidden bg-gradient-to-br text-white xl:col-span-1', st.cls)}>
          <div className="p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                <StatusIcon className="h-6 w-6" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Current risk status</p>
                <p className="text-2xl font-bold">{risk.status}</p>
              </div>
            </div>
            <p className="mt-4 text-sm opacity-90">{st.text}</p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-white/15 p-3">
                <p className="text-xs opacity-80">Limit breaches</p>
                <p className="text-xl font-bold">{risk.breaches.length}</p>
              </div>
              <div className="rounded-xl bg-white/15 p-3">
                <p className="text-xs opacity-80">Awaiting review</p>
                <p className="text-xl font-bold">{unreviewed}</p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between gap-2 text-xs opacity-90">
              <span>Session started {formatDateTime(settings.sessionStart)}</span>
              <Button size="xs" variant="secondary" icon={PlayCircle} onClick={newSession}>New session</Button>
            </div>
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="How much you have lost" subtitle={`"Approaching" warning at ${pct}% of a limit`} icon={TrendingDown} />
          <div className="grid gap-5 p-5 md:grid-cols-3">
            {meters.map((m) => (
              <div key={m.label}>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{m.label}</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{m.count ? m.value : formatAmount(m.value)}</p>
                {m.limit ? (
                  <>
                    <div className="mt-2">
                      <ProgressBar value={m.value} max={m.limit} tone={m.value > m.limit ? 'bg-red-500' : m.value >= (m.limit * pct) / 100 ? 'bg-amber-500' : 'bg-emerald-500'} />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">
                      Limit {m.count ? m.limit : formatAmount(m.limit)} · Remaining{' '}
                      <span className="font-semibold text-slate-700">{m.count ? m.remaining : formatAmount(m.remaining)}</span>
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-xs text-slate-400">Limit disabled</p>
                )}
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            Per-record limit: <strong>{formatAmount(settings.maxLossPerRecord)}</strong> · Losses are measured from completed P&L records (net result).
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader title="My limits" subtitle="Change these any time" icon={ShieldAlert} />
          <form onSubmit={save} className="space-y-4 p-5" noValidate>
            <Field label="Most I can lose in one play (₹)" required error={errors.maxLossPerRecord}>
              <Input inputMode="decimal" value={form.maxLossPerRecord} onChange={setNum('maxLossPerRecord')} error={errors.maxLossPerRecord} />
            </Field>
            <div className="rounded-xl border border-slate-200 p-3">
              <Toggle checked={form.dailyLimitEnabled} onChange={(v) => setForm((f) => ({ ...f, dailyLimitEnabled: v }))} label="Daily loss limit" />
              {form.dailyLimitEnabled && (
                <Field error={errors.dailyLossLimit} className="mt-2">
                  <Input inputMode="decimal" value={form.dailyLossLimit} onChange={setNum('dailyLossLimit')} error={errors.dailyLossLimit} />
                </Field>
              )}
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <Toggle checked={form.sessionLimitEnabled} onChange={(v) => setForm((f) => ({ ...f, sessionLimitEnabled: v }))} label="Session loss limit" />
              {form.sessionLimitEnabled && (
                <Field error={errors.sessionLossLimit} className="mt-2">
                  <Input inputMode="decimal" value={form.sessionLossLimit} onChange={setNum('sessionLossLimit')} error={errors.sessionLossLimit} />
                </Field>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Max plays per session" error={errors.maxRecordsPerSession}>
                <Input inputMode="numeric" value={form.maxRecordsPerSession} onChange={setNum('maxRecordsPerSession')} error={errors.maxRecordsPerSession} />
              </Field>
              <Field label="Warn me at (%)" error={errors.approachingPct}>
                <Input inputMode="numeric" value={form.approachingPct} onChange={setNum('approachingPct')} error={errors.approachingPct} />
              </Field>
            </div>
            <div className="space-y-2">
              <p className="label mb-0">Warn me</p>
              <Toggle checked={form.warnOnApproach !== false} onChange={(v) => setForm((f) => ({ ...f, warnOnApproach: v }))} label="When I get close to a limit" />
              <Toggle checked={form.warnOnExceed !== false} onChange={(v) => setForm((f) => ({ ...f, warnOnExceed: v }))} label="When I cross a limit" />
            </div>
            <Field label="My notes">
              <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </Field>
            <Button type="submit" icon={Save} className="w-full">Save my limits</Button>
          </form>
        </Card>

        <div className="space-y-6 xl:col-span-3">
          <RiskBreachChart data={breachSeries(risk.alerts)} height={220} />
          <Card>
            <CardHeader title="Warnings" subtitle="Times you got close to or crossed a limit" icon={AlertOctagon} />
            <DataTable
              rows={risk.alerts}
              pageSize={8}
              empty={<EmptyState icon={CheckCircle2} title="No risk alerts" message="Nothing has approached or exceeded your limits." />}
              columns={[
                { key: 'at', header: 'Date', render: (a) => formatDateTime(a.at) },
                { key: 'scope', header: 'Limit' },
                { key: 'level', header: 'Level', render: (a) => <StatusBadge status={a.level} /> },
                { key: 'amount', header: 'Recorded / limit', align: 'right', render: (a) => (a.isCount ? `${a.amount} / ${a.limit}` : `${formatAmount(a.amount)} / ${formatAmount(a.limit)}`) },
                {
                  key: 'recordId',
                  header: 'Record',
                  render: (a) =>
                    a.recordId ? (
                      <button className="font-mono text-xs font-semibold text-indigo-600 hover:underline" onClick={() => setRecordView(a.recordId)}>
                        {a.recordId}
                      </button>
                    ) : '—',
                },
                {
                  key: 'review',
                  header: 'Review',
                  sortable: false,
                  render: (a) =>
                    a.review ? (
                      <span className="block max-w-[220px] truncate text-xs text-slate-600" title={a.review.note}>✓ {a.review.note}</span>
                    ) : (
                      <Button size="xs" variant={a.level === RISK_STATUS.OVER ? 'soft' : 'ghost'} icon={MessageSquarePlus} onClick={() => { setReviewing(a); setNote(''); }}>
                        Add note
                      </Button>
                    ),
                },
              ]}
            />
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Per-record limit" value={formatAmount(settings.maxLossPerRecord)} icon={ShieldAlert} tone="slate" />
        <StatCard label="Daily limit" value={settings.dailyLimitEnabled ? formatAmount(settings.dailyLossLimit) : 'Off'} icon={ShieldAlert} tone="slate" />
        <StatCard label="Session limit" value={settings.sessionLimitEnabled ? formatAmount(settings.sessionLossLimit) : 'Off'} icon={ShieldAlert} tone="slate" />
        <StatCard label="Max plays per session" value={settings.maxRecordsPerSession} icon={ShieldAlert} tone="slate" />
      </div>

      <Modal
        open={Boolean(reviewing)}
        onClose={() => setReviewing(null)}
        title="Add review note"
        subtitle={reviewing ? `${reviewing.scope} · ${reviewing.level} · ${formatDateTime(reviewing.at)}` : ''}
        footer={
          <>
            <Button variant="secondary" onClick={() => setReviewing(null)}>Cancel</Button>
            <Button onClick={saveReview} disabled={!note.trim()}>Save note</Button>
          </>
        }
      >
        <Field label="What happened and what will you do differently?" required>
          <Textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} autoFocus />
        </Field>
      </Modal>

      <Modal open={Boolean(record)} onClose={() => setRecordView(null)} title={`Affected record ${record?.id || ''}`} footer={<Button variant="secondary" onClick={() => setRecordView(null)}>Close</Button>}>
        {record && (
          <dl className="grid grid-cols-2 gap-4">
            <KeyValue label="Match">{matchTitle(data.matchById(record.matchId))}</KeyValue>
            <KeyValue label="Entry record">{record.recordId || '—'}</KeyValue>
            <KeyValue label="Gross"><Money value={record.gross} /></KeyValue>
            <KeyValue label="Net"><Money value={record.net} /></KeyValue>
            <KeyValue label="Exit reason">{record.exitReason || '—'}</KeyValue>
            <KeyValue label="Exit time">{formatDateTime(record.exitAt)}</KeyValue>
            <KeyValue label="Notes" className="col-span-2">{record.notes || '—'}</KeyValue>
          </dl>
        )}
      </Modal>
    </div>
  );
}
