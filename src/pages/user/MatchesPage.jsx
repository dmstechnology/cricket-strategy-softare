import { useMemo, useState } from 'react';
import { CalendarDays, RotateCcw, Search } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { Button, Card, EmptyState, Field, Input, PageHeader, Select, Tabs } from '../../components/ui';
import MatchCard from '../../components/cards/MatchCard';
import { latestUpdateFor } from '../../utils/calculations';

const EMPTY = { q: '', tournament: '', format: '', date: '' };

export default function MatchesPage() {
  const { matches, matchUpdates } = useAppData();
  const [tab, setTab] = useState('upcoming');
  const [f, setF] = useState(EMPTY);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const tournaments = [...new Set(matches.map((m) => m.tournament))];
  const groups = {
    upcoming: matches.filter((m) => m.status === 'Upcoming' || m.status === 'In Progress'),
    completed: matches.filter((m) => m.status === 'Completed' || m.status === 'Abandoned'),
    all: matches,
  };

  const filtered = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    return groups[tab]
      .filter((m) => !f.tournament || m.tournament === f.tournament)
      .filter((m) => !f.format || m.format === f.format)
      .filter((m) => !f.date || m.date === f.date)
      .filter(
        (m) =>
          !q ||
          [m.teamA.name, m.teamB.name, m.teamA.short, m.teamB.short, m.id, m.venue].some((s) => s.toLowerCase().includes(q))
      )
      .sort((a, b) => (tab === 'completed' ? (a.date < b.date ? 1 : -1) : a.date < b.date ? -1 : a.date > b.date ? 1 : a.time < b.time ? -1 : 1));
  }, [matches, tab, f]);

  return (
    <>
      <PageHeader title="Matches" description="Find a match and open it to see details. Scores are typed in by people, not live." />
      <Card className="mb-6 p-4">
        <div className="flex flex-col gap-4">
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'upcoming', label: 'Live & upcoming', count: groups.upcoming.length },
              { value: 'completed', label: 'Completed', count: groups.completed.length },
              { value: 'all', label: 'All', count: groups.all.length },
            ]}
            className="self-start"
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="Search" className="lg:col-span-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input value={f.q} onChange={set('q')} placeholder="Search teams, venue or match ID" className="pl-9" />
              </div>
            </Field>
            <Field label="Tournament">
              <Select value={f.tournament} onChange={set('tournament')} placeholder="All tournaments" options={tournaments} />
            </Field>
            <Field label="Format">
              <Select value={f.format} onChange={set('format')} placeholder="All formats" options={['T20', 'ODI', 'Test']} />
            </Field>
            <Field label="Date">
              <div className="flex gap-2">
                <Input type="date" value={f.date} onChange={set('date')} />
                <Button variant="secondary" icon={RotateCcw} onClick={() => setF(EMPTY)} aria-label="Reset filters" />
              </div>
            </Field>
          </div>
        </div>
      </Card>

      {filtered.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((m) => (
            <MatchCard key={m.id} match={m} latest={latestUpdateFor(m.id, matchUpdates)} to={`/user/matches/${m.id}`} />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState icon={CalendarDays} title="No matches found" message="Try a different tab or clear the filters." action={<Button variant="secondary" onClick={() => setF(EMPTY)}>Clear filters</Button>} />
        </Card>
      )}
    </>
  );
}
