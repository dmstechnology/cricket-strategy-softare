import { useState } from 'react';
import { Copy, Edit3, Plus, Save, Settings2, ShieldAlert, Trash2 } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import {
  Alert, Badge, Button, Card, CardHeader, ConfirmDialog, Field, Input, Modal, PageHeader, Select, StatusBadge, Textarea, Toggle, cx, useToast,
} from '../../components/ui';
import { ConfigEditor, blankConfig } from '../user/RightEntryPage';
import { TARGET_RULES, describeCondition } from '../../utils/calculations';
import { isValidNumber } from '../../utils/validation';

export default function StrategyManagementPage() {
  const data = useAppData();
  const toast = useToast();
  const [edit, setEdit] = useState(null);
  const [cfg, setCfg] = useState(null);
  const [delCfg, setDelCfg] = useState(null);
  const [risk, setRisk] = useState(data.defaultRisk);
  const [riskErr, setRiskErr] = useState('');
  const templates = data.entryConfigs.filter((c) => c.userId === null);

  const saveStrategy = () => {
    data.updateCoreStrategy(edit.key, {
      name: edit.name.trim(),
      tagline: edit.tagline.trim(),
      description: edit.description.trim(),
      rules: edit.rulesText.split('\n').map((r) => r.trim()).filter(Boolean),
      ...(edit.config ? { config: edit.config } : {}),
    });
    toast(`${edit.name} updated for all users.`);
    setEdit(null);
  };

  const saveRisk = () => {
    const keys = ['maxLossPerRecord', 'dailyLossLimit', 'sessionLossLimit', 'maxRecordsPerSession', 'approachingPct'];
    if (keys.some((k) => !isValidNumber(risk[k]) || Number(risk[k]) <= 0)) return setRiskErr('All sample values must be positive numbers.');
    setRiskErr('');
    data.updateDefaultRisk(Object.fromEntries(keys.map((k) => [k, Number(risk[k])])));
    toast('Default sample risk values saved. Users who have not customised their limits now use these.');
  };

  return (
    <>
      <PageHeader title="Strategy Management" description="Edit informational descriptions, sample rules and configuration values, and enable or disable modules in the demo interface." />
      <Alert type="info" className="mb-6">These settings only change what users see and how demo records are evaluated. Nothing here can trigger real-money activity.</Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        {data.coreStrategies.map((s) => (
          <Card key={s.key} className={cx(!s.enabled && 'bg-slate-50')}>
            <CardHeader
              title={s.name}
              subtitle={s.tagline}
              icon={Settings2}
              action={
                <>
                  <Toggle checked={s.enabled} onChange={(v) => { data.updateCoreStrategy(s.key, { enabled: v }); toast(`${s.name} ${v ? 'enabled' : 'disabled'} in the user interface.`, v ? 'success' : 'warning'); }} label={s.enabled ? 'Enabled' : 'Disabled'} />
                  <Button size="xs" variant="secondary" icon={Edit3} onClick={() => setEdit({ ...s, rulesText: s.rules.join('\n') })}>Edit</Button>
                </>
              }
            />
            <div className="space-y-3 p-5">
              <p className="text-sm text-slate-600">{s.description}</p>
              <ul className="space-y-1">
                {s.rules.map((r) => <li key={r} className="flex gap-2 text-sm text-slate-700"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />{r}</li>)}
              </ul>
              {s.config?.targetRule && <p className="text-xs text-slate-500">Target rule: <strong>{TARGET_RULES[s.config.targetRule]}</strong></p>}
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader title="Right Entry templates" subtitle="Sample configurations available to every user" icon={Copy} action={<Button size="sm" icon={Plus} onClick={() => setCfg(blankConfig(null))}>New template</Button>} />
        <div className="grid gap-4 p-5 lg:grid-cols-2">
          {templates.map((c) => (
            <div key={c.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.id} · {c.format}</p>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <ul className="mt-2 space-y-0.5">
                {c.conditions.map((x) => <li key={x.id} className="text-xs text-slate-600">• {describeCondition(x)}{x.required === false && ' (optional)'}</li>)}
              </ul>
              <div className="mt-3 flex gap-2">
                <Button size="xs" variant="secondary" icon={Edit3} onClick={() => setCfg(c)}>Edit</Button>
                <Button size="xs" variant="ghost" icon={Trash2} className="text-red-600 hover:bg-red-50" onClick={() => setDelCfg(c)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Sample loss-cut configuration" subtitle="Defaults for users who haven't set their own limits" icon={ShieldAlert} action={<Button size="sm" icon={Save} onClick={saveRisk}>Save values</Button>} />
        <div className="grid gap-4 p-5 sm:grid-cols-3 lg:grid-cols-5">
          {riskErr && <Alert type="danger" className="sm:col-span-3 lg:col-span-5">{riskErr}</Alert>}
          <Field label="Max loss / record (₹)"><Input value={risk.maxLossPerRecord} onChange={(e) => setRisk({ ...risk, maxLossPerRecord: e.target.value })} /></Field>
          <Field label="Daily limit (₹)"><Input value={risk.dailyLossLimit} onChange={(e) => setRisk({ ...risk, dailyLossLimit: e.target.value })} /></Field>
          <Field label="Session limit (₹)"><Input value={risk.sessionLossLimit} onChange={(e) => setRisk({ ...risk, sessionLossLimit: e.target.value })} /></Field>
          <Field label="Max records / session"><Input value={risk.maxRecordsPerSession} onChange={(e) => setRisk({ ...risk, maxRecordsPerSession: e.target.value })} /></Field>
          <Field label="Approaching at (%)"><Input value={risk.approachingPct} onChange={(e) => setRisk({ ...risk, approachingPct: e.target.value })} /></Field>
        </div>
      </Card>

      <Modal open={Boolean(edit)} onClose={() => setEdit(null)} size="lg" title={`Edit ${edit?.name || ''}`} footer={<><Button variant="secondary" onClick={() => setEdit(null)}>Cancel</Button><Button icon={Save} onClick={saveStrategy}>Save</Button></>}>
        {edit && (
          <div className="space-y-3">
            <Field label="Name"><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Tagline"><Input value={edit.tagline} onChange={(e) => setEdit({ ...edit, tagline: e.target.value })} /></Field>
            <Field label="Description"><Textarea rows={4} value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
            <Field label="Demo rules (one per line)"><Textarea rows={5} value={edit.rulesText} onChange={(e) => setEdit({ ...edit, rulesText: e.target.value })} /></Field>
            {edit.config?.targetRule && (
              <Field label="Book Profit target rule">
                <Select value={edit.config.targetRule} onChange={(e) => setEdit({ ...edit, config: { ...edit.config, targetRule: e.target.value } })} options={Object.entries(TARGET_RULES).map(([value, label]) => ({ value, label }))} />
              </Field>
            )}
            <Badge tone="amber">Informational text only</Badge>
          </div>
        )}
      </Modal>

      <ConfigEditor
        key={cfg?.id || (cfg ? 'new-template' : 'closed')}
        open={Boolean(cfg)}
        initial={cfg}
        matches={data.matches}
        onClose={() => setCfg(null)}
        onSave={(c) => {
          if (c.id) data.updateEntryConfig(c.id, c);
          else data.addEntryConfig({ ...c, userId: null });
          toast(`Template "${c.name}" saved.`);
          setCfg(null);
        }}
      />
      <ConfirmDialog open={Boolean(delCfg)} onClose={() => setDelCfg(null)} title="Delete template?" message={`"${delCfg?.name}" will no longer be available to users. Existing records keep their saved evaluation.`} confirmLabel="Delete" onConfirm={() => { data.deleteEntryConfig(delCfg.id); toast('Template deleted.', 'info'); }} />
    </>
  );
}
