import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Clock, FileText, History, Send, ShieldAlert } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import {
  Alert, Button, Card, CardHeader, Checkbox, DemoNotice, EmptyState, Field, Input, KeyValue, PageHeader, Select, StatusBadge,
  Textarea, useToast,
} from '../../components/ui';
import { ClaimProgress } from './ClaimStatusTimeline';
import { formatAmount, formatDate, formatDateTime } from '../../utils/formatters';
import { isValidNumber } from '../../utils/validation';

const EMPTY = { category: '', amount: '', explanation: '', confirm: false };

export default function ClaimsPage() {
  const data = useAppData();
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const kycStatus = data.kycStatus(user.id);
  const kycOk = kycStatus.startsWith('Approved') || !data.settings.requireKycForClaims;
  const myClaims = data.claims.filter((c) => c.userId === user.id).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  const active = myClaims.filter((c) => !['Completed (Simulated)', 'Rejected (Simulated)'].includes(c.status));

  const submit = (ev) => {
    ev.preventDefault();
    const e = {};
    if (!form.category) e.category = 'Choose a claim category.';
    if (!isValidNumber(form.amount) || Number(form.amount) <= 0) e.amount = 'Enter a positive demo amount.';
    else if (Number(form.amount) > 50000) e.amount = 'Demo claims are limited to ₹50,000.';
    if (form.explanation.length > 500) e.explanation = 'Keep the explanation under 500 characters.';
    if (!form.confirm) e.confirm = 'Please confirm you understand this is a simulated claim.';
    setErrors(e);
    if (Object.keys(e).length) return;
    const id = data.submitClaim(user.id, { category: form.category, amount: Number(form.amount), explanation: form.explanation.trim() });
    toast(`Claim ${id} submitted. Track it in Claim History.`, 'success', 'Demo claim submitted');
    setForm(EMPTY);
  };

  return (
    <>
      <PageHeader
        title="Claim Money"
        description="Ask for money from your demo account."
        actions={<Link to="/user/claims/history"><Button variant="secondary" icon={History}>My Claims</Button></Link>}
      />
      <DemoNotice className="mb-6">
        All claim amounts and records are simulated. No actual money is distributed, and status changes never represent a real payout or payment commitment.
      </DemoNotice>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader title="New claim" icon={FileText} action={<span className="flex items-center gap-1.5 text-xs text-slate-500">ID check: <StatusBadge status={kycStatus} /></span>} />
          {kycOk ? (
            <form onSubmit={submit} className="space-y-4 p-5" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Type of claim" required error={errors.category}>
                  <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} error={errors.category} placeholder="Select category" options={data.settings.claimCategories} />
                </Field>
                <Field label="Amount (₹)" required error={errors.amount}>
                  <Input inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} error={errors.amount} placeholder="e.g. 1500" />
                </Field>
              </div>
              <Field label="Explanation (optional)" error={errors.explanation} hint={`${form.explanation.length}/500`}>
                <Textarea value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} error={errors.explanation} />
              </Field>
              <div>
                <Checkbox
                  checked={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.checked })}
                  label="I understand this is a simulated claim and no real money will be paid."
                />
                {errors.confirm && <p className="mt-1 text-xs font-medium text-red-600">{errors.confirm}</p>}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Current estimated processing time: <strong className="text-slate-700">{data.settings.claimProcessingTime}</strong></span>
                <Button type="submit" icon={Send}>Send claim</Button>
              </div>
            </form>
          ) : (
            <div className="p-5">
              <Alert type="warning" title="Please verify your ID first">
                Your simulated KYC status is <strong>{kycStatus}</strong>. You need a verified ID before you can claim money.
              </Alert>
              <div className="mt-6 flex flex-col items-center text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><ShieldAlert className="h-7 w-7" /></span>
                <p className="mt-3 text-sm text-slate-600">
                  {kycStatus === 'Pending Review' ? 'Your request is waiting for the admin to update its simulated status.' : 'Submit the demo KYC form to continue.'}
                </p>
                <Link to="/user/kyc" className="mt-4"><Button icon={BadgeCheck}>Verify my ID</Button></Link>
              </div>
            </div>
          )}
        </Card>

        <div className="space-y-4 xl:col-span-2">
          <h3 className="text-sm font-semibold text-slate-900">Your open claims</h3>
          {active.length ? (
            active.map((c) => (
              <Card key={c.id} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-sm font-semibold text-slate-800">{c.id}</p>
                  <StatusBadge status={c.status} />
                </div>
                <div className="mt-3"><ClaimProgress status={c.status} /></div>
                <dl className="mt-3 grid grid-cols-2 gap-3">
                  <KeyValue label="Category">{c.category}</KeyValue>
                  <KeyValue label="Amount">{formatAmount(c.amount)}</KeyValue>
                  <KeyValue label="Submitted">{formatDate(c.submittedAt)}</KeyValue>
                  <KeyValue label="Est. processing">{c.processingTime}</KeyValue>
                </dl>
                <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/60 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">Message from admin</p>
                  <p className="mt-0.5 text-sm text-slate-700">{c.message}</p>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">Last updated {formatDateTime(c.updatedAt)}</p>
              </Card>
            ))
          ) : (
            <Card><EmptyState icon={FileText} title="No active claims" message="Submitted claims will appear here with their latest status." className="py-8" /></Card>
          )}
        </div>
      </div>
    </>
  );
}
