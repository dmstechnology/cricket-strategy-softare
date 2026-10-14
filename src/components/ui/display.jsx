import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cx } from './primitives';
import { formatAmount } from '../../utils/formatters';

const ICON_TONES = {
  indigo: 'bg-indigo-50 text-indigo-600',
  green: 'bg-emerald-50 text-emerald-600',
  red: 'bg-red-50 text-red-600',
  amber: 'bg-amber-50 text-amber-600',
  blue: 'bg-blue-50 text-blue-600',
  violet: 'bg-violet-50 text-violet-600',
  slate: 'bg-slate-100 text-slate-600',
};

export function StatCard({ label, value, icon: Icon, tone = 'indigo', hint, trend, to, simulated }) {
  const body = (
    <div className="card group flex h-full flex-col justify-between p-4 transition hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        {Icon && (
          <span className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', ICON_TONES[tone])}>
            <Icon className="h-[18px] w-[18px]" />
          </span>
        )}
      </div>
      <div className="mt-2">
        <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {trend !== undefined && trend !== null && (
            <span className={cx('inline-flex items-center font-semibold', trend >= 0 ? 'text-emerald-600' : 'text-red-600')}>
              {trend >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            </span>
          )}
          {hint && <span>{hint}</span>}
          {simulated && <span className="rounded bg-amber-100 px-1 text-[10px] font-bold uppercase text-amber-800">Demo</span>}
        </div>
      </div>
    </div>
  );
  return to ? (
    <Link to={to} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

export function PageHeader({ title, description, actions, badge }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
          {badge}
        </div>
        {description && <p className="mt-1 max-w-3xl text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Money({ value, sign = true, className }) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return <span className={cx('text-slate-400', className)}>—</span>;
  }
  const n = Number(value);
  return (
    <span className={cx('whitespace-nowrap font-semibold tabular-nums', n > 0 ? 'text-emerald-600' : n < 0 ? 'text-red-600' : 'text-slate-600', className)}>
      {formatAmount(n, { sign })}
    </span>
  );
}

export function TeamBadge({ team, size = 'md' }) {
  if (!team) return null;
  const s = size === 'lg' ? 'h-14 w-14 text-base' : size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-10 w-10 text-xs';
  return (
    <span
      className={cx('flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-sm ring-2 ring-white', s)}
      style={{ background: `linear-gradient(135deg, ${team.color}, ${team.color}cc)` }}
      title={team.name}
    >
      {team.short}
    </span>
  );
}

export function ProgressBar({ value, max = 100, tone }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const auto = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={cx('h-full rounded-full transition-all', tone || auto)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function KeyValue({ label, children, className }) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{children}</dd>
    </div>
  );
}
