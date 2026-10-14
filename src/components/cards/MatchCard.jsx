import { Link } from 'react-router-dom';
import { CalendarDays, Clock, MapPin, ArrowRight } from 'lucide-react';
import { StatusBadge, TeamBadge, Badge } from '../ui';
import { formatAmount, formatDate, timeAgo } from '../../utils/formatters';

export default function MatchCard({ match, latest, to }) {
  return (
    <div className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${match.teamA.color}, ${match.teamB.color})` }} />
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] font-semibold text-slate-400">{match.id}</span>
          <div className="flex items-center gap-1.5">
            <Badge tone="indigo">{match.format}</Badge>
            <StatusBadge status={match.status} />
          </div>
        </div>
        <p className="mt-1 truncate text-xs font-medium text-slate-500">{match.tournament}</p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-col items-center text-center">
            <TeamBadge team={match.teamA} />
            <p className="mt-1.5 line-clamp-2 text-xs font-semibold text-slate-800">{match.teamA.name}</p>
          </div>
          <div className="flex flex-col items-center">
            {latest ? (
              <>
                <p className="text-lg font-bold tabular-nums text-slate-900">
                  {latest.score}/{latest.wickets}
                </p>
                <p className="text-[11px] text-slate-500">
                  {latest.battingTeam} · {latest.overs} ov
                </p>
              </>
            ) : (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">VS</span>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-center text-center">
            <TeamBadge team={match.teamB} />
            <p className="mt-1.5 line-clamp-2 text-xs font-semibold text-slate-800">{match.teamB.name}</p>
          </div>
        </div>
        {latest && <p className="mt-2 text-center text-[11px] text-slate-400">Manually entered · {timeAgo(latest.timestamp)}</p>}
        {match.result && <p className="mt-2 text-center text-xs font-medium text-slate-600">{match.result}</p>}

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" /> {formatDate(match.date)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> {match.time}
          </span>
          <span className="flex items-center gap-1.5 truncate">
            <MapPin className="h-3.5 w-3.5 shrink-0" /> {match.venue}
          </span>
          <span className="font-semibold text-slate-700">
            Entry: {Number(match.entryAmount) > 0 ? formatAmount(Number(match.entryAmount), { decimals: 0 }) : 'Free'}
          </span>
        </div>
        {match.notes && (
          <p className="mt-3 line-clamp-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Note: </span>
            {match.notes}
          </p>
        )}
        <div className="mt-auto pt-4">
          <Link
            to={to}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-sm font-medium text-indigo-600 transition group-hover:border-indigo-200 group-hover:bg-indigo-50"
          >
            View Details <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
