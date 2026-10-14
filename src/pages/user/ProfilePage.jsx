import { useState } from 'react';
import { KeyRound, Save, User } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { Alert, Button, Card, CardHeader, Field, Input, KeyValue, PageHeader, StatusBadge, useToast } from '../../components/ui';
import { walletSummary, summarizePnl } from '../../utils/calculations';
import { formatAmount, formatDate, initials } from '../../utils/formatters';
import { isEmail, isMobile, passwordIssues } from '../../utils/validation';

export default function ProfilePage() {
  const data = useAppData();
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user.name, email: user.email, mobile: user.mobile });
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [pwErrors, setPwErrors] = useState({});

  const saveProfile = (ev) => {
    ev.preventDefault();
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!isEmail(form.email)) e.email = 'Enter a valid email.';
    if (!isMobile(form.mobile)) e.mobile = 'Enter a valid mobile number.';
    setErrors(e);
    if (Object.keys(e).length) return;
    data.updateUser(user.id, { name: form.name.trim(), email: form.email.trim(), mobile: form.mobile.trim() });
    toast('Profile updated.', 'success');
  };

  const savePw = (ev) => {
    ev.preventDefault();
    const e = {};
    if (pw.current !== user.password) e.current = 'Current password is incorrect.';
    const issues = passwordIssues(pw.next);
    if (issues.length) e.next = `Needs ${issues.join(', ')}.`;
    if (pw.next !== pw.confirm) e.confirm = 'Passwords do not match.';
    setPwErrors(e);
    if (Object.keys(e).length) return;
    data.updateUser(user.id, { password: pw.next });
    setPw({ current: '', next: '', confirm: '' });
    toast('Demo password changed for this session.', 'success');
  };

  const w = walletSummary(data.transactions.filter((t) => t.userId === user.id));
  const p = summarizePnl(data.pnlRecords.filter((r) => r.userId === user.id));

  return (
    <>
      <PageHeader title="Profile" description="Your account details." />
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-6 text-center">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl font-bold text-white shadow-lg">
            {initials(user.name)}
          </span>
          <p className="mt-4 text-lg font-bold text-slate-900">{user.name}</p>
          <p className="text-sm text-slate-500">@{user.username}</p>
          <div className="mt-3 flex justify-center gap-2"><StatusBadge status={user.status} /><StatusBadge status="User" /></div>
          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 text-left">
            <KeyValue label="User ID">{user.id}</KeyValue>
            <KeyValue label="Registered">{formatDate(user.registeredAt)}</KeyValue>
            <KeyValue label="Demo KYC"><StatusBadge status={data.kycStatus(user.id)} /></KeyValue>
            <KeyValue label="Simulated balance">{formatAmount(w.balance)}</KeyValue>
            <KeyValue label="Completed records">{p.count}</KeyValue>
            <KeyValue label="Risk status"><StatusBadge status={data.getRisk(user.id).status} /></KeyValue>
          </dl>
        </Card>
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader title="Profile details" icon={User} />
            <form onSubmit={saveProfile} className="grid gap-4 p-5 sm:grid-cols-2" noValidate>
              <Field label="Full name" error={errors.name}><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} /></Field>
              <Field label="Username" hint="Usernames cannot be changed."><Input value={user.username} disabled /></Field>
              <Field label="Email" error={errors.email}><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} /></Field>
              <Field label="Mobile" error={errors.mobile}><Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} error={errors.mobile} /></Field>
              <div className="flex justify-end sm:col-span-2"><Button type="submit" icon={Save}>Save profile</Button></div>
            </form>
          </Card>
          <Card>
            <CardHeader title="Change password (demo)" icon={KeyRound} />
            <form onSubmit={savePw} className="grid gap-4 p-5 sm:grid-cols-3" noValidate>
              <Field label="Current" error={pwErrors.current}><Input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} error={pwErrors.current} /></Field>
              <Field label="New" error={pwErrors.next}><Input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} error={pwErrors.next} /></Field>
              <Field label="Confirm" error={pwErrors.confirm}><Input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} error={pwErrors.confirm} /></Field>
              <Alert type="info" className="sm:col-span-2">Passwords are held in memory only for this demo and reset on refresh. A real system must hash passwords server-side.</Alert>
              <div className="flex items-end justify-end"><Button type="submit" variant="secondary">Update password</Button></div>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
