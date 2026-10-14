import { AlertTriangle, CheckCircle2, Info, ShieldAlert, XCircle, Inbox, FlaskConical } from 'lucide-react';
import { cx } from './primitives';

const TONES = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  amber: 'bg-amber-50 text-amber-800 ring-amber-600/25',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  gray: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
};

const DOTS = {
  green: 'bg-emerald-500',
  red: 'bg-red-500',
  amber: 'bg-amber-500',
  blue: 'bg-blue-500',
  violet: 'bg-violet-500',
  gray: 'bg-slate-400',
  indigo: 'bg-indigo-500',
};

const STATUS_TONES = {
  green: [
    'Completed', 'Approved (Simulated)', 'Completed (Simulated)', 'Active', 'Compliant', 'Conditions Satisfied',
    'Within Limit', 'Published', 'Entry', 'Target Reached', 'Success', 'Entry Completed',
  ],
  red: [
    'Failed', 'Rejected (Simulated)', 'Inactive', 'Non-Compliant', 'Conditions Not Satisfied', 'Limit Exceeded',
    'Abandoned', 'Disabled',
  ],
  amber: [
    'Pending', 'Pending Review', 'Approaching Limit', 'Manual Review Required', 'Partially Compliant', 'Under Review',
    'Review Required', 'Draft', 'Open', 'Manual Review', 'Target Missed',
  ],
  blue: ['Submitted', 'In Progress', 'Upcoming', 'Credit'],
  violet: ['Processing', 'Admin'],
  gray: ['Not Submitted', 'Closed', 'Archived', 'Unpublished', 'No Entry', 'Debit', 'User'],
};

export function toneFor(status) {
  for (const [tone, list] of Object.entries(STATUS_TONES)) {
    if (list.includes(status)) return tone;
  }
  return 'gray';
}

export function Badge({ tone = 'gray', children, dot, className }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        TONES[tone],
        className
      )}
    >
      {dot && <span className={cx('h-1.5 w-1.5 rounded-full', DOTS[tone])} />}
      {children}
    </span>
  );
}

export function StatusBadge({ status, className }) {
  if (!status) return null;
  return (
    <Badge tone={toneFor(status)} dot className={className}>
      {status}
    </Badge>
  );
}

export function SimBadge({ className }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800', className)}>
      <FlaskConical className="h-3 w-3" /> Simulated
    </span>
  );
}

const ALERT_STYLES = {
  info: { box: 'border-blue-200 bg-blue-50 text-blue-900', icon: Info, iconCls: 'text-blue-600' },
  success: { box: 'border-emerald-200 bg-emerald-50 text-emerald-900', icon: CheckCircle2, iconCls: 'text-emerald-600' },
  warning: { box: 'border-amber-200 bg-amber-50 text-amber-900', icon: AlertTriangle, iconCls: 'text-amber-600' },
  danger: { box: 'border-red-200 bg-red-50 text-red-900', icon: XCircle, iconCls: 'text-red-600' },
  demo: { box: 'border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-950', icon: ShieldAlert, iconCls: 'text-amber-600' },
};

export function Alert({ type = 'info', title, children, className, action }) {
  const s = ALERT_STYLES[type] || ALERT_STYLES.info;
  const Icon = s.icon;
  return (
    <div className={cx('flex gap-3 rounded-xl border px-4 py-3 text-sm', s.box, className)} role={type === 'danger' ? 'alert' : 'status'}>
      <Icon className={cx('mt-0.5 h-5 w-5 shrink-0', s.iconCls)} />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cx(title && 'mt-0.5', 'opacity-90')}>{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}

export function DemoNotice({ children, title = 'Demonstration only', className }) {
  return (
    <Alert type="demo" title={title} className={className}>
      {children}
    </Alert>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, message, action, className }) {
  return (
    <div className={cx('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon className="h-6 w-6" />
      </span>
      <h4 className="mt-4 text-sm font-semibold text-slate-800">{title}</h4>
      {message && <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
