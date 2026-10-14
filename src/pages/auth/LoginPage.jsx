import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, ShieldCheck, User } from 'lucide-react';
import AuthShell from './AuthShell';
import { useAuth } from '../../context/AuthContext';
import { Alert, Button, Checkbox, Field, Input } from '../../components/ui';

const DEMO_ACCOUNTS = [
  { role: 'Admin', username: 'admin', password: 'Admin123!', icon: ShieldCheck, cls: 'text-violet-600 bg-violet-50' },
  { role: 'Normal User', username: 'demo', password: 'Demo123!', icon: User, cls: 'text-indigo-600 bg-indigo-50' },
];

export default function LoginPage() {
  const { login, rememberedUsername } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: rememberedUsername, password: '', remember: Boolean(rememberedUsername) });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((er) => ({ ...er, [k]: undefined }));
    setAuthError('');
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.username.trim()) errs.username = 'Username is required.';
    if (!form.password) errs.password = 'Password is required.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    // Small delay so the demo feels like a real sign-in.
    setTimeout(() => {
      const res = login(form.username, form.password, form.remember);
      setLoading(false);
      if (!res.ok) return setAuthError(res.error);
      navigate(res.user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
    }, 400);
  };

  const fill = (acc) => {
    setForm((f) => ({ ...f, username: acc.username, password: acc.password }));
    setErrors({});
    setAuthError('');
  };

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
      <p className="mt-1 text-sm text-slate-500">Sign in to your Cricket Strategy Pro demo workspace.</p>

      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        {authError && <Alert type="danger">{authError}</Alert>}
        <Field label="Username" error={errors.username} htmlFor="username">
          <Input id="username" autoComplete="username" value={form.username} onChange={set('username')} error={errors.username} placeholder="e.g. demo" />
        </Field>
        <Field label="Password" error={errors.password} htmlFor="password">
          <div className="relative">
            <Input
              id="password"
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              value={form.password}
              onChange={set('password')}
              error={errors.password}
              className="pr-10"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <div className="flex items-center justify-between">
          <Checkbox label="Remember me" checked={form.remember} onChange={set('remember')} />
          <span className="text-xs text-slate-400">Password reset needs a backend</span>
        </div>
        <Button type="submit" className="w-full" size="lg" icon={LogIn} loading={loading}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="font-semibold text-indigo-600 hover:text-indigo-700">
          Create one
        </Link>
      </p>

      <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Demo credentials — click to fill</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.username}
              type="button"
              onClick={() => fill(acc)}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-indigo-300 hover:shadow-sm"
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${acc.cls}`}>
                <acc.icon className="h-4 w-4" />
              </span>
              <span className="text-xs">
                <span className="block font-semibold text-slate-800">{acc.role}</span>
                <span className="block font-mono text-slate-500">
                  {acc.username} / {acc.password}
                </span>
              </span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-slate-400">Simulated authentication for presentation only — not production-secure.</p>
      </div>
    </AuthShell>
  );
}
