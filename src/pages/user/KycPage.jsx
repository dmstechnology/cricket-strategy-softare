import { useState } from 'react';
import { BadgeCheck, Check, FileCheck2, Send, ShieldCheck } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import {
  Alert, Button, Card, CardHeader, Checkbox, DemoNotice, Field, Input, KeyValue, PageHeader, Select, StatusBadge, cx, useToast,
} from '../../components/ui';
import { formatDateTime, maskReference } from '../../utils/formatters';

const STEPS = ['Not Submitted', 'Pending Review', 'Reviewed (Simulated)'];

// Patterns resembling real identity numbers are rejected so no real data is entered.
const looksReal = (v) => {
  const s = v.replace(/[\s-]/g, '').toUpperCase();
  return /^\d{12}$/.test(s) || /^[A-Z]{5}\d{4}[A-Z]$/.test(s) || /^\d{9,18}$/.test(s);
};

export default function KycPage() {
  const data = useAppData();
  const { user } = useAuth();
  const toast = useToast();
  const kyc = data.getKyc(user.id);
  const status = kyc?.status || 'Not Submitted';
  const canSubmit = status === 'Not Submitted' || status.startsWith('Rejected');
  const [form, setForm] = useState({ displayName: user.name, docCategory: '', docReference: '', consent: false });
  const [errors, setErrors] = useState({});

  const submit = (ev) => {
    ev.preventDefault();
    const e = {};
    if (!form.displayName.trim()) e.displayName = 'Display name is required.';
    if (!form.docCategory) e.docCategory = 'Choose a demo document category.';
    if (!form.docReference.trim()) e.docReference = 'Enter a fictional reference.';
    else if (!/^[A-Za-z0-9-]{4,20}$/.test(form.docReference.trim())) e.docReference = '4–20 letters, numbers or dashes.';
    else if (looksReal(form.docReference)) e.docReference = 'This looks like a real identity or account number. Please use a fictional value like DEMO-4821.';
    if (!form.consent) e.consent = 'Please confirm the consent statement.';
    setErrors(e);
    if (Object.keys(e).length) return;
    data.submitKyc(user.id, {
      displayName: form.displayName.trim(),
      docCategory: form.docCategory,
      docReference: maskReference(form.docReference.trim()),
    });
    toast('Your demo KYC request is now Pending Review. The admin will update the simulated status.', 'success', 'Demo KYC submitted');
  };

  const stepIndex = status === 'Not Submitted' ? 0 : status === 'Pending Review' ? 1 : 2;

  return (
    <>
      <PageHeader title="Verify ID" description="Verify your ID once to unlock money claims." />
      <DemoNotice title="Do not enter real identity information" className="mb-6">
        Do not enter Aadhaar, PAN, passport, bank details or any real document number, and do not upload images. Use fictional references only.
        Statuses are set manually by the demo admin — no actual identity verification takes place.
      </DemoNotice>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader title="Your status" icon={ShieldCheck} action={<StatusBadge status={status} />} />
          <div className="p-5">
            <ol className="space-y-4">
              {STEPS.map((s, i) => (
                <li key={s} className="flex items-center gap-3">
                  <span className={cx('flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold', i < stepIndex ? 'bg-emerald-500 text-white' : i === stepIndex ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : 'bg-slate-100 text-slate-400')}>
                    {i < stepIndex ? <Check className="h-4 w-4" /> : i + 1}
                  </span>
                  <span className={cx('text-sm', i <= stepIndex ? 'font-semibold text-slate-800' : 'text-slate-400')}>
                    {i === 2 && stepIndex === 2 ? status : s}
                  </span>
                </li>
              ))}
            </ol>
            <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5">
              <KeyValue label="Demo user">{kyc?.displayName || user.name}</KeyValue>
              <KeyValue label="Reference">{kyc?.reference ? <span className="font-mono text-xs">{kyc.reference}</span> : '—'}</KeyValue>
              <KeyValue label="Submitted">{kyc ? formatDateTime(kyc.submittedAt) : '—'}</KeyValue>
              <KeyValue label="Last updated">{kyc ? formatDateTime(kyc.updatedAt) : '—'}</KeyValue>
              <KeyValue label="Document category">{kyc?.docCategory || '—'}</KeyValue>
              <KeyValue label="Masked reference">{kyc?.docReference ? <span className="font-mono">{kyc.docReference}</span> : '—'}</KeyValue>
              <KeyValue label="Admin remarks" className="col-span-2">{kyc?.remarks || '—'}</KeyValue>
            </dl>
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title={status.startsWith('Rejected') ? 'Try again' : 'Verify your ID'} icon={FileCheck2} />
          {canSubmit ? (
            <form onSubmit={submit} className="space-y-4 p-5" noValidate>
              {status.startsWith('Rejected') && <Alert type="danger" title="Previous demo request was rejected (simulated)">{kyc?.remarks || 'No remarks provided.'}</Alert>}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Display name" required error={errors.displayName}>
                  <Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} error={errors.displayName} />
                </Field>
                <Field label="Document type" required error={errors.docCategory}>
                  <Select value={form.docCategory} onChange={(e) => setForm({ ...form, docCategory: e.target.value })} error={errors.docCategory} placeholder="Select category" options={data.settings.kycDocCategories} />
                </Field>
              </div>
              <Field label="Document number (practice)" required error={errors.docReference} hint="e.g. DEMO-4821 — only a masked version (••••4821) is stored.">
                <Input value={form.docReference} onChange={(e) => setForm({ ...form, docReference: e.target.value })} error={errors.docReference} placeholder="DEMO-4821" />
              </Field>
              {form.docReference && !errors.docReference && (
                <p className="text-xs text-slate-500">Will be stored as: <span className="font-mono">{maskReference(form.docReference)}</span></p>
              )}
              <div>
                <Checkbox
                  checked={form.consent}
                  onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                  label="I confirm the reference above is fictional and understand this is a simulated workflow with no real identity verification."
                />
                {errors.consent && <p className="mt-1 text-xs font-medium text-red-600">{errors.consent}</p>}
              </div>
              <div className="flex justify-end">
                <Button type="submit" icon={Send}>Send for verification</Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <span className={cx('flex h-14 w-14 items-center justify-center rounded-2xl', status.startsWith('Approved') ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600')}>
                <BadgeCheck className="h-7 w-7" />
              </span>
              <p className="mt-4 text-base font-semibold text-slate-900">
                {status.startsWith('Approved') ? 'Your ID is verified' : 'Your demo request is awaiting admin review'}
              </p>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                {status.startsWith('Approved')
                  ? 'You can now submit demo claim requests. This approval is simulated and confers no real verification.'
                  : 'Log in as the admin (admin / Admin123!) and open KYC Management to change the simulated status.'}
              </p>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
