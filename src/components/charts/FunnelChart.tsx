import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Funnel } from '../../lib/selectors';

type Props = { data: Funnel };

/** The only funnel that matters: sent -> heard back -> interviewing -> offer. */
function FunnelChart({ data }: Props) {
  const rows = [
    { stage: 'Sent', count: data.sent },
    { stage: 'Responded', count: data.responded },
    { stage: 'Interviewing', count: data.interviewing },
    { stage: 'Offer', count: data.offers },
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={rows} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="stage" stroke="var(--text)" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="var(--text)" fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 12,
            color: 'var(--text-h)',
          }}
          cursor={{ fill: 'var(--accent-bg)' }}
        />
        <Bar dataKey="count" fill="var(--accent)" radius={[6, 6, 0, 0]} maxBarSize={54} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default FunnelChart;
