import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

export type HourSlice = { name: string; value: number; color: string };

type Props = { data: HourSlice[] };

/** Where the 37.5 planned hours of a week actually go. */
function HoursChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={44} outerRadius={70} paddingAngle={2}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} stroke="var(--bg)" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v) => `${Number(v)} h`}
          contentStyle={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 12,
            color: 'var(--text-h)',
          }}
        />
        <Legend
          verticalAlign="middle"
          align="right"
          layout="vertical"
          iconType="circle"
          wrapperStyle={{ fontSize: 11.5, color: 'var(--text)' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default HoursChart;
