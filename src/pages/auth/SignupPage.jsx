import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Eye, EyeOff, UserPlus, X } from 'lucide-react';
import AuthShell from './AuthShell';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Alert, Button, Checkbox, Field, Input, cx } from '../../components/ui';
import { isEmail, isMobile, isUsername, passwordIssues } from '../../utils/validation';

const EMPTY = { name: '', username: '', email: '', mobile: '', password: '', confirm: '', terms: false };

export default function SignupPage() {
  const { signup, isUsernameTaken } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [formError, setFormError] = useState('');

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((er) => ({ ...er, [k]: undefined }));
    setFormError('');
  };

  const pwIssues = passwordIssues(form.password);
  const usernameState = !form.username
    ? null
    : !isUsername(form.username)
      ? 'invalid'
      : isUsernameTaken(form.username)
        ? 'taken'
        : 'ok';

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required.';
    if (!form.username.trim()) e.username = 'Username is required.';
    else if (!isUsername(form.username)) e.username = '3–20 characters: letters, numbers, dot or underscore.';
    else if (isUsernameTaken(form.username)) e.username = 'That username is already taken.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!isEmail(form.email)) e.email = 'Enter a valid email address.';
    if (!form.mobile.trim()) e.mobile = 'Mobile number is required.';
    else if (!isMobile(form.mobile)) e.mobile = 'Enter a valid mobile number (10–15 digits).';
    if (!form.password) e.password = 'Password is required.';
    else if (pwIssues.length) e.password = `Password needs ${pwIssues.join(', ')}.`;
    if (!form.confirm) e.confirm = 'Please confirm your password.';
    else if (form.confirm !== form.password) e.confirm = 'Passwords do not match.';
    if (!form.terms) e.terms = 'You must accept the demo terms.';
    return e;
  };

  const submit = (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    const res = signup(form);
    if (!res.ok) return setFormError(res.error);
    toast(`Welcome, ${res.user.name}! Your demo account was created with a ₹10,000 simulated credit.`, 'success', 'Registration successful');
    navigate('/user/dashboard');
  };

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create your demo account</h1>
      <p className="mt-1 text-sm text-slate-500">Registration is simulated and stored only in this browser tab.</p>

      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        {formError && <Alert type="danger">{formError}</Alert>}
        <Field label="Full name" required error={errors.name}>
          <Input value={form.name} onChange={set('name')} error={errors.name} placeholder="e.g. Priya Sharma" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Username"
            required
            error={errors.username}
            hint={usernameState === 'ok' ? '✓ Username available' : usernameState === 'taken' ? 'Already taken' : undefined}
          >
            <Input value={form.username} onChange={set('username')} error={errors.username || usernameState === 'taken'} placeholder="priya_s" />
          </Field>
          <Field label="Mobile number" required error={errors.mobile}>
            <Input value={form.mobile} onChange={set('mobile')} error={errors.mobile} placeholder="+91 98xxx xxxxx" inputMode="tel" />
          </Field>
        </div>
        <Field label="Email" required error={errors.email}>
          <Input type="email" value={form.email} onChange={set('email')} error={errors.email} placeholder="you@example.com" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" required error={errors.password}>
            <div className="relative">
              <Input type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} error={errors.password} className="pr-10" />
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
          <Field label="Confirm password" required error={errors.confirm}>
            <Input type={showPw ? 'text' : 'password'} value={form.confirm} onChange={set('confirm')} error={errors.confirm} />
          </Field>
        </div>
        {form.password && (
          <ul className="grid grid-cols-2 gap-1 text-xs">
            {['at least 8 characters', 'an uppercase letter', 'a lowercase letter', 'a number'].map((rule) => {
              const ok = !pwIssues.includes(rule);
              return (
                <li key={rule} className={cx('flex items-center gap-1', ok ? 'text-emerald-600' : 'text-slate-400')}>
                  {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} {rule}
                </li>
              );
            })}
          </ul>
        )}
        <div>
          <Checkbox
            checked={form.terms}
            onChange={set('terms')}
            label="I understand this is a demonstration and accept the demo terms."
            description="No real money, betting, identity verification or payouts are involved."
          />
          {errors.terms && <p className="mt-1 text-xs font-medium text-red-600">{errors.terms}</p>}
        </div>
        <Button type="submit" size="lg" className="w-full" icon={UserPlus}>
          Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
