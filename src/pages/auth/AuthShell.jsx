import { Crosshair, Activity, Target, ShieldAlert, FlaskConical } from 'lucide-react';
import { Logo } from '../../components/layout/Sidebar';

const FEATURES = [
  { icon: Crosshair, title: 'Right Entry', text: 'Configurable entry conditions evaluated against manual match inputs.' },
  { icon: Activity, title: 'Live Match Tracking', text: 'A chronological, manually entered match-observation journal.' },
  { icon: Target, title: 'Book Profit', text: 'Record targets and hypothetical outcomes with documented formulas.' },
  { icon: ShieldAlert, title: 'Strict Loss Cut', text: 'Configurable limits with warnings when simulated results exceed them.' },
];

export default function AuthShell({ children }) {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="relative hidden w-[46%] overflow-hidden bg-navy-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]" aria-hidden="true">
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M32 0H0V32" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        <div className="relative">
          <Logo />
        </div>
        <div className="relative">
          <h2 className="text-3xl font-bold leading-tight text-white xl:text-4xl">
            Disciplined cricket strategy,
            <br />
            <span className="bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">recorded and reviewed.</span>
          </h2>
          <p className="mt-4 max-w-md text-sm text-slate-400">
            Track matches, record strategy decisions, analyse simulated results and monitor risk limits — all in one workspace.
          </p>
          <div className="mt-8 grid gap-4 xl:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <Icon className="h-5 w-5 text-indigo-300" />
                <p className="mt-2 text-sm font-semibold text-white">{title}</p>
                <p className="mt-1 text-xs text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative flex items-center gap-2 text-xs text-slate-500">
          <FlaskConical className="h-4 w-4 text-amber-400" />
          Frontend demonstration. No real money, betting or payouts are processed.
        </p>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="inline-flex rounded-xl bg-navy-900 px-3 py-2">
              <Logo />
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
