import {
  Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { Card, CardHeader, EmptyState, SimBadge } from '../ui';
import { formatAmount, formatNumber } from '../../utils/formatters';

// Categorical order from the validated reference palette (never cycled).
export const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];
// Polarity / status colours (reserved for gain/loss and risk states).
export const GAIN = '#059669';
export const LOSS = '#dc2626';
export const WARN = '#d97706';
export const NEUTRAL = '#94a3b8';

const AXIS = { fontSize: 11, fill: '#64748b' };
const GRID = '#eef2f7';

export function ChartCard({ title, subtitle, icon = BarChart3, empty, height = 260, children, action, simulated = true }) {
  return (
    <Card className="flex flex-col">
      <CardHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        action={
          <>
            {simulated && <SimBadge />}
            {action}
          </>
        }
      />
      <div className="flex-1 px-2 pb-3 pt-4 sm:px-4">
        {empty ? (
          <EmptyState title="No data to chart yet" message="Add records or change the filters to see this chart." className="py-8" />
        ) : (
          <div style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
              {children}
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Card>
  );
}

function TooltipBox({ active, payload, label, money = true, labelFormatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      {label !== undefined && <p className="mb-1 font-semibold text-slate-800">{labelFormatter ? labelFormatter(label) : label}</p>}
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-slate-600">
          <span className="h-2 w-2 rounded-full" style={{ background: p.payload?.fill && p.dataKey === 'value' ? p.payload.fill : p.color }} />
          <span>{p.name}:</span>
          <span className="font-semibold tabular-nums text-slate-900">
            {money ? formatAmount(p.value, { sign: true }) : formatNumber(p.value)}
          </span>
        </p>
      ))}
    </div>
  );
}

const moneyTick = (v) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : v);

/** data: [{ label, net, cumulative }] */
export function PnlTrendChart({ data, height }) {
  return (
    <ChartCard title="Simulated P&L trend" subtitle="Daily net result (bars) and cumulative net (line)" empty={!data.length} height={height}>
      <ComposedChart data={data} margin={{ top: 5, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={moneyTick} />
        <Tooltip content={<TooltipBox />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="net" name="Daily net" radius={[4, 4, 4, 4]} maxBarSize={28}>
          {data.map((d) => (
            <Cell key={d.label} fill={d.net >= 0 ? GAIN : LOSS} />
          ))}
        </Bar>
        <Line type="monotone" dataKey="cumulative" name="Cumulative net" stroke={SERIES[0]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
      </ComposedChart>
    </ChartCard>
  );
}

/** data: [{ name, net, count }] */
export function StrategyPerformanceChart({ data, height }) {
  return (
    <ChartCard title="Strategy-wise recorded performance" subtitle="Net simulated result per strategy module" empty={!data.length} height={height}>
      <BarChart data={data} margin={{ top: 5, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="name" tick={AXIS} tickLine={false} axisLine={false} interval={0} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={moneyTick} />
        <Tooltip content={<TooltipBox />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
        <Bar dataKey="net" name="Net result" radius={[4, 4, 4, 4]} maxBarSize={48}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.net >= 0 ? GAIN : LOSS} />
          ))}
        </Bar>
      </BarChart>
    </ChartCard>
  );
}

function Donut({ data, total, centerLabel }) {
  return (
    <PieChart>
      <Tooltip content={<TooltipBox money={false} />} />
      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
      <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="82%" paddingAngle={2} stroke="#fff" strokeWidth={2}>
        {data.map((d) => (
          <Cell key={d.name} fill={d.fill} />
        ))}
      </Pie>
      <text x="50%" y="44%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-900 text-xl font-bold">
        {total}
      </text>
      <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-500 text-[11px]">
        {centerLabel}
      </text>
    </PieChart>
  );
}

/** counts: { satisfied, notSatisfied, review } */
export function ComplianceChart({ counts, complianceRate, height }) {
  const data = [
    { name: 'Satisfied', value: counts.satisfied, fill: GAIN },
    { name: 'Not satisfied', value: counts.notSatisfied, fill: LOSS },
    { name: 'Manual review', value: counts.review, fill: WARN },
    { name: 'Simple entries', value: counts.completed || 0, fill: SERIES[0] },
  ].filter((d) => d.value > 0);
  const total = counts.satisfied + counts.notSatisfied + counts.review + (counts.completed || 0);
  return (
    <ChartCard
      title="Right Entry condition compliance"
      subtitle={complianceRate !== null ? `Rule compliance rate: ${complianceRate.toFixed(0)}%` : 'No records yet'}
      empty={!total}
      height={height}
    >
      <Donut data={data} total={total} centerLabel="entry records" />
    </ChartCard>
  );
}

/** data: [{ label, updates, records }] */
export function MatchActivityChart({ data, height }) {
  return (
    <ChartCard title="Match tracking activity" subtitle="Manual updates and strategy records per day" empty={!data.length} height={height}>
      <BarChart data={data} margin={{ top: 5, right: 8, left: -16, bottom: 0 }} barGap={2}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip content={<TooltipBox money={false} />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="updates" name="Match updates" fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={22} />
        <Bar dataKey="records" name="Strategy records" fill={SERIES[1]} radius={[4, 4, 0, 0]} maxBarSize={22} />
      </BarChart>
    </ChartCard>
  );
}

/** data: [{ label, exceeded, approaching }] */
export function RiskBreachChart({ data, height }) {
  return (
    <ChartCard title="Risk-limit breach history" subtitle="Alerts by date (exceeded vs approaching)" empty={!data.length} height={height}>
      <BarChart data={data} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip content={<TooltipBox money={false} />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="exceeded" name="Limit exceeded" stackId="a" fill={LOSS} maxBarSize={28} />
        <Bar dataKey="approaching" name="Approaching limit" stackId="a" fill={WARN} radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ChartCard>
  );
}

export function CompletionChart({ completed, incomplete, height }) {
  const data = [
    { name: 'Completed', value: completed, fill: SERIES[0] },
    { name: 'Open / incomplete', value: incomplete, fill: NEUTRAL },
  ].filter((d) => d.value > 0);
  return (
    <ChartCard title="Completed vs incomplete records" subtitle="P&L records by completion status" empty={!(completed + incomplete)} height={height}>
      <Donut data={data} total={completed + incomplete} centerLabel="P&L records" />
    </ChartCard>
  );
}

/** Small area chart of one match's score progression. data: [{ overs, score }] */
export function ScoreProgressChart({ data, height = 200 }) {
  return (
    <ChartCard title="Score progression" subtitle="From manual updates (not a live feed)" empty={data.length < 2} height={height}>
      <ComposedChart data={data} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES[0]} stopOpacity={0.25} />
            <stop offset="100%" stopColor={SERIES[0]} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} />
        <Tooltip content={<TooltipBox money={false} />} />
        <Area type="monotone" dataKey="score" name="Runs" stroke={SERIES[0]} strokeWidth={2} fill="url(#scoreFill)" dot={{ r: 3 }} />
      </ComposedChart>
    </ChartCard>
  );
}
