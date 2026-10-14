import { useState } from 'react';
import { AlertTriangle, CheckCircle2, FileText, RotateCcw, Save, Server, Settings } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { Alert, Button, Card, CardHeader, ConfirmDialog, Field, Input, Textarea, Toggle, PageHeader, useToast } from '../../components/ui';

const SIMULATED = [
  'Authentication & roles (credentials checked in the browser against mock data)',
  'Signup, user records and profile changes (in memory, reset on refresh)',
  'Match fixtures, teams, tournaments and all scores (fictional / manually entered)',
  'Wallet balances and transactions (no deposits, withdrawals, UPI, cards or bank transfers)',
  'KYC workflow (fictional masked references; no identity verification)',
  'Claim requests and statuses (no money is ever distributed)',
  'P&L results, risk alerts and analytics (hypothetical demo calculations)',
  'Notifications (in-app only; no email/SMS/push)',
];
const PRODUCTION = [
  'Backend API & database with server-side validation and audit logs',
  'Secure authentication: hashed passwords, sessions/tokens, MFA, rate limiting, password reset',
  'Role-based access control enforced on the server',
  'Licensed cricket data provider for fixtures and scores',
  'Regulated payment processing, if any money handling is ever introduced',
  'Real KYC/AML provider integration and data-protection compliance (e.g. DPDP Act)',
  'Legal review of betting/gaming laws in every target jurisdiction',
  'Security engineering: penetration testing, secrets management, monitoring',
];

export default function SettingsPage() {
  const data = useAppData();
  const toast = useToast();
  const [s, setS] = useState(data.settings);
  const [cats, setCats] = useState(data.settings.claimCategories.join('\n'));
  const [confirmReset, setConfirmReset] = useState(false);
  const [err, setErr] = useState('');

  const save = () => {
    if (!s.claimDefaultMessage.trim() || !s.claimProcessingTime.trim()) return setErr('Default message and processing time are required.');
    const list = cats.split('\n').map((c) => c.trim()).filter(Boolean);
    if (!list.length) return setErr('Add at least one claim category.');
    setErr('');
    data.updateSettings({ ...s, claimDefaultMessage: s.claimDefaultMessage.trim(), claimProcessingTime: s.claimProcessingTime.trim(), claimCategories: list });
    toast('Settings saved. New claims will use the updated default message and processing time.');
  };

  return (
    <>
      <PageHeader title="Settings" description="Configure claim processing defaults and demo behaviour." actions={<Button icon={Save} onClick={save}>Save settings</Button>} />
      {err && <Alert type="danger" className="mb-4">{err}</Alert>}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Claim processing" icon={FileText} />
          <div className="space-y-4 p-5">
            <Field label="Default claim message" hint="Applied to newly submitted claims. Existing claims can be edited individually in Claim Management.">
              <Textarea rows={5} value={s.claimDefaultMessage} onChange={(e) => setS({ ...s, claimDefaultMessage: e.target.value })} />
            </Field>
            <Field label="Default estimated processing time"><Input value={s.claimProcessingTime} onChange={(e) => setS({ ...s, claimProcessingTime: e.target.value })} /></Field>
            <Field label="Claim categories (one per line)"><Textarea rows={4} value={cats} onChange={(e) => setCats(e.target.value)} /></Field>
            <Toggle checked={s.requireKycForClaims} onChange={(v) => setS({ ...s, requireKycForClaims: v })} label="Require approved demo KYC before claim submission" />
          </div>
        </Card>
        <Card>
          <CardHeader title="Demo behaviour" icon={Settings} />
          <div className="space-y-4 p-5">
            <Toggle checked={s.showDemoBanner} onChange={(v) => setS({ ...s, showDemoBanner: v })} label="Show the demonstration banner on every page" />
            <Alert type="warning" title="Reset demo data">
              Restores all mock users, matches, records, claims and settings to their initial state. You stay signed in if your account exists in the mock data.
            </Alert>
            <Button variant="danger" icon={RotateCcw} onClick={() => setConfirmReset(true)}>Reset all demo data</Button>
          </div>
        </Card>
        <Card>
          <CardHeader title="What is simulated in this demo" icon={CheckCircle2} />
          <ul className="space-y-2 p-5">
            {SIMULATED.map((x) => <li key={x} className="flex gap-2 text-sm text-slate-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />{x}</li>)}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Required before any production deployment" icon={Server} />
          <ul className="space-y-2 p-5">
            {PRODUCTION.map((x) => <li key={x} className="flex gap-2 text-sm text-slate-700"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />{x}</li>)}
          </ul>
        </Card>
      </div>
      <ConfirmDialog open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset all demo data?" message="Every change made in this session will be lost." confirmLabel="Reset" onConfirm={() => { data.resetDemo(); toast('Demo data reset.', 'info'); }} />
    </>
  );
}
