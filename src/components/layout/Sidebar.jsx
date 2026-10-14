import { NavLink } from 'react-router-dom';
import { LogOut, X } from 'lucide-react';
import { cx } from '../ui';

export function Logo({ compact }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-900/40">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="8" />
          <path d="M6.5 9.5c3.5 1.6 7.5 1.6 11 0M6.5 14.5c3.5-1.6 7.5-1.6 11 0" strokeLinecap="round" />
        </svg>
      </span>
      {!compact && (
        <div className="leading-tight">
          <p className="text-sm font-bold text-white">Cricket Strategy Pro</p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-300">Demo build</p>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ nav, open, onClose, onLogout, badges = {}, role }) {
  return (
    <>
      <div
        className={cx('fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-sm transition-opacity lg:hidden', open ? 'opacity-100' : 'pointer-events-none opacity-0')}
        onClick={onClose}
      />
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-navy-900 text-slate-300 transition-transform duration-200 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/5 px-5">
          <Logo />
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-white/10 lg:hidden" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        {role === 'admin' && (
        <div className="px-5 pt-4">
          <span
            className={cx(
              'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest',
              role === 'admin' ? 'bg-violet-500/20 text-violet-200' : 'bg-indigo-500/20 text-indigo-200'
            )}
          >
            Admin console
          </span>
        </div>
        )}
        <nav className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin">
          {nav.map((group) => (
            <div key={group.section} className="mb-4">
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{group.section}</p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const badge = item.badge ? badges[item.badge] : 0;
                  return (
                    <li key={item.label}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        onClick={onClose}
                        className={({ isActive }) =>
                          cx(
                            'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                            isActive
                              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-950/40'
                              : 'text-slate-400 hover:bg-white/5 hover:text-white'
                          )
                        }
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0" />
                        <span className="flex-1 truncate">{item.label}</span>
                        {badge > 0 && (
                          <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">{badge}</span>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-white/5 p-3">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
