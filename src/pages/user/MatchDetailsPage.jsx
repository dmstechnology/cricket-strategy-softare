import { Link, useParams } from 'react-router-dom';
import { Activity, ArrowLeft, BarChart3, CheckCircle2, CalendarDays, Clock, Crosshair, MapPin, ShieldAlert, Trophy, Users } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import {
  Alert, Badge, Button, Card, CardHeader, EmptyState, KeyValue, Money, StatusBadge, TeamBadge, SimBadge,
} from '../../components/ui';
import { ScoreProgressChart } from '../../components/charts/Charts';
import { matchTitle, runRate, summarizePnl } from '../../utils/calculations';
import { formatDate, formatDateTime } from '../../utils/formatters';

export default function MatchDetailsPage() {
  const { id } = useParams();
  const data = useAppData();
  const { user } = useAuth();
  const match = data.matchById(id);

  if (!match) {
    return (
      <Card>
        <EmptyState
          icon={Trophy}
          title="Match not found"
          message={`No demo match with ID ${id}. It may have been deleted by the admin.`}
          action={<Link to="/user/matches"><Button variant="secondary" icon={ArrowLeft}>Back to matches</Button></Link>}
        />
      </Card>
    );
  }

  const updates = data.matchUpdates.filter((u) => u.matchId === id).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const latest = updates[updates.length - 1];
  const records = data.entryRecords.filter((r) => r.matchId === id && r.userId === user.id);
  const pnl = data.pnlRecords.filter((r) => r.matchId === id && r.userId === user.id);
  const pnlSum = summarizePnl(pnl);
  const allPnl = data.pnlRecords.filter((r) => r.matchId === id);
  const allSum = summarizePnl(allPnl);
  const risk = data.getRisk(user.id);
  const matchAlerts = risk.alerts.filter((a) => a.matchId === id || pnl.some((p) => p.id === a.recordId));

  // Historical demo stats: previous fixtures involving either team.
  const teamCodes = [match.teamA.short, match.teamB.short];
  const history = data.matches.filter(
    (m) => m.id !== id && m.status === 'Completed' && (teamCodes.includes(m.teamA.short) || teamCodes.includes(m.teamB.short))
  );
  const crr = latest ? runRate(latest.score, latest.overs) : null;

  return (
    <>
      <Link to="/user/matches" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> All matches
      </Link>
      <h1 className="sr-only">Match details: {match.teamA.name} vs {match.teamB.name}</h1>

      <Card className="overflow-hidden">
        <div className="relative bg-gradient-to-br from-navy-900 via-navy-800 to-indigo-900 px-5 py-8 text-white sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-indigo-200">
              <span className="font-mono">{match.id}</span> · {match.tournament}
            </span>
            <div className="flex items-center gap-2">
              <Badge tone="indigo">{match.format}</Badge>
              <StatusBadge status={match.status} />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 items-center gap-4">
            <div className="flex flex-col items-center text-center">
              <TeamBadge team={match.teamA} size="lg" />
              <p className="mt-2 text-sm font-semibold sm:text-base">{match.teamA.name}</p>
            </div>
            <div className="text-center">
              {latest ? (
                <>
                  <p className="text-3xl font-extrabold tabular-nums sm:text-4xl">{latest.score}/{latest.wickets}</p>
                  <p className="text-sm text-indigo-200">{latest.battingTeam} · {latest.overs} ov</p>
                  <p className="mt-1 text-[11px] text-indigo-300">Manually entered</p>
                </>
              ) : (
                <p className="text-2xl font-bold text-indigo-200">VS</p>
              )}
            </div>
            <div className="flex flex-col items-center text-center">
              <TeamBadge team={match.teamB} size="lg" />
              <p className="mt-2 text-sm font-semibold sm:text-base">{match.teamB.name}</p>
            </div>
          </div>
          {match.result && <p className="mt-5 text-center text-sm font-medium text-indigo-100">{match.result}</p>}
        </div>
        <dl className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4 sm:px-8">
          <KeyValue label="Date"><span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5 text-slate-400" />{formatDate(match.date)}</span></KeyValue>
          <KeyValue label="Start time"><span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-slate-400" />{match.time}</span></KeyValue>
          <KeyValue label="Venue"><span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-400" />{match.venue}</span></KeyValue>
          <KeyValue label="Run rate (entered data)">{crr === null ? '—' : crr.toFixed(2)}</KeyValue>
        </dl>
        <div className="flex flex-wrap gap-2 border-t border-slate-100 px-5 py-4 sm:px-8">
          {data.entryRecords.some((r) => r.kind === 'simple' && r.userId === user.id && r.matchId === id) ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"><CheckCircle2 className="h-4 w-4" /> Entry completed</span>
          ) : ['Upcoming', 'In Progress'].includes(match.status) ? (
            <Link to={`/user/strategies/right-entry?match=${id}`}><Button icon={Crosshair}>Entry Check · {Number(match.entryAmount) > 0 ? `₹${Number(match.entryAmount)}` : 'Free'}</Button></Link>
          ) : null}
          <Link to={`/user/strategies/live-tracking?match=${id}`}><Button variant="secondary" icon={Activity}>Add Match Note</Button></Link>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader title="Match overview & strategy notes" icon={Trophy} />
            <div className="space-y-4 p-5">
              <p className="text-sm text-slate-600">{match.notes || 'No informational notes added by the admin.'}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {[match.teamA, match.teamB].map((t) => (
                  <div key={t.short} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                    <TeamBadge team={t} />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                      <p className="text-xs text-slate-500">
                        {data.matches.filter((m) => m.status === 'Completed' && (m.teamA.short === t.short || m.teamB.short === t.short)).length} completed demo fixtures
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <ScoreProgressChart data={updates.map((u) => ({ label: `${u.battingTeam} ${u.overs}`, score: u.score }))} />

          <Card>
            <CardHeader title="Match observation timeline" subtitle={`${updates.length} manual update(s)`} icon={Activity} />
            {updates.length ? (
              <ol className="space-y-3 p-5">
                {updates.map((u) => (
                  <li key={u.id} className="flex gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-semibold tabular-nums text-slate-900">{u.battingTeam} {u.score}/{u.wickets} ({u.overs})</span>{' '}
                        <span className="text-slate-600">{u.notes}</span>
                      </p>
                      <p className="text-xs text-slate-400">{formatDateTime(u.timestamp)} {u.relatedRecordId && `· linked to ${u.relatedRecordId}`}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState title="No observations yet" message="Updates added in Live Match Tracking will appear here." className="py-8" />
            )}
          </Card>

          <Card>
            <CardHeader title="Your related strategy records" icon={Crosshair} />
            {records.length ? (
              <ul className="divide-y divide-slate-100">
                {records.map((r) => {
                  const p = pnl.find((x) => x.recordId === r.id);
                  return (
                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{r.id} · {r.configName}</p>
                        <p className="text-xs text-slate-500">{r.decision} · {r.reason}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {p && <Money value={p.net} />}
                        <StatusBadge status={r.evaluation.outcome} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState title="No records for this match" message="Use Entry Check to create one." className="py-8" />
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Historical demo statistics" icon={BarChart3} action={<SimBadge />} />
            <dl className="grid grid-cols-2 gap-4 p-5">
              <KeyValue label="Your net (this match)"><Money value={pnlSum.count ? pnlSum.net : null} /></KeyValue>
              <KeyValue label="Your completed records">{pnlSum.count}</KeyValue>
              <KeyValue label="All users' net">{allSum.count ? <Money value={allSum.net} /> : '—'}</KeyValue>
              <KeyValue label="Records (all users)">{allSum.count}</KeyValue>
            </dl>
            <div className="border-t border-slate-100 px-5 py-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Previous fixtures for these teams</p>
              {history.length ? (
                <ul className="space-y-1.5">
                  {history.slice(0, 5).map((m) => (
                    <li key={m.id} className="text-xs text-slate-600">
                      <Link to={`/user/matches/${m.id}`} className="font-medium text-indigo-600 hover:underline">{matchTitle(m)}</Link>{' '}
                      · {formatDate(m.date)} — {m.result || 'No result'}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">No previous demo fixtures.</p>
              )}
            </div>
            <p className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400">Past demo results do not predict or guarantee future outcomes.</p>
          </Card>

          <Card>
            <CardHeader title="Risk notes" icon={ShieldAlert} action={<StatusBadge status={risk.status} />} />
            <div className="space-y-3 p-5">
              {matchAlerts.length ? (
                matchAlerts.map((a) => (
                  <Alert key={a.id} type={a.level === 'Limit Exceeded' ? 'danger' : 'warning'} title={`${a.scope}: ${a.level}`}>
                    Record {a.recordId} · {a.review ? `Reviewed: ${a.review.note}` : 'No review note yet.'}
                  </Alert>
                ))
              ) : (
                <p className="text-sm text-slate-500">No risk alerts linked to this match.</p>
              )}
              <p className="text-xs text-slate-500">
                Per-record limit {data.getRiskSettings(user.id).maxLossPerRecord} (demo). Warnings are informational only and cannot stop any external transaction.
              </p>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Users className="h-4 w-4 text-slate-400" /> Data source</div>
            <p className="mt-1 text-xs text-slate-500">
              Fixtures are fictional and maintained by the admin. Scores are manually entered by users/admin and are not verified.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
