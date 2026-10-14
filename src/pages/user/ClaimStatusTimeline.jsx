import { Check } from 'lucide-react';
import { cx } from '../../components/ui';
import { formatDateTime } from '../../utils/formatters';

export const CLAIM_FLOW = ['Submitted', 'Under Review', 'Approved (Simulated)', 'Processing', 'Completed (Simulated)'];

export function ClaimProgress({ status }) {
  const rejected = status.startsWith('Rejected');
  const idx = CLAIM_FLOW.indexOf(status);
  return (
    <div className="flex items-center gap-1">
      {CLAIM_FLOW.map((s, i) => (
        <div key={s} className="flex flex-1 flex-col items-center gap-1">
          <div className={cx('h-1.5 w-full rounded-full', rejected ? (i === 0 ? 'bg-red-400' : 'bg-slate-200') : i <= idx ? 'bg-indigo-500' : 'bg-slate-200')} />
          <span className="hidden text-center text-[10px] text-slate-500 sm:block">{s.replace(' (Simulated)', '')}</span>
        </div>
      ))}
    </div>
  );
}

export default function ClaimStatusTimeline({ history }) {
  return (
    <ol className="relative space-y-4 border-l border-slate-200 pl-5">
      {[...history].reverse().map((h, i) => (
        <li key={`${h.status}-${h.at}`} className="relative">
          <span className={cx('absolute -left-[27px] flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white', i === 0 ? 'bg-indigo-600' : 'bg-slate-300')}>
            {i === 0 && <Check className="h-2.5 w-2.5 text-white" />}
          </span>
          <p className="text-sm font-semibold text-slate-800">{h.status}</p>
          <p className="text-xs text-slate-500">{formatDateTime(h.at)}</p>
          {h.note && <p className="mt-0.5 text-xs text-slate-600">{h.note}</p>}
        </li>
      ))}
    </ol>
  );
}
