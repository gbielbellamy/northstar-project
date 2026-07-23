import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export type WeekPoint = { week: string; done: number };

type Props = { data: WeekPoint[] };

/** Completion across the whole programme, week by week. */
function WeekProgressChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
        <defs>
          <linearGradient id="wpFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="week" stroke="var(--text)" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis
          stroke="var(--text)"
          fontSize={11}
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(v) => `${Number(v)}%`}
          contentStyle={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 12,
            color: 'var(--text-h)',
          }}
        />
        <Area
          type="monotone"
          dataKey="done"
          stroke="var(--accent)"
          strokeWidth={2}
          fill="url(#wpFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default WeekProgressChart;
