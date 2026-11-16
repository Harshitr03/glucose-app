import { CartesianGrid, Legend, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { SLOTS } from '../constants';

const SLOT_COLORS = {
  morning_fasting: '#2563eb',
  after_breakfast: '#16a34a',
  after_lunch: '#d97706',
  after_dinner: '#9333ea',
};

function toChartRows(readings, from, to) {
  const rows = [];
  const lastDay = Number(to.slice(8, 10));
  for (let day = Number(from.slice(8, 10)); day <= lastDay; day += 1) rows.push({ day });
  for (const reading of readings) {
    const row = rows[Number(reading.date.slice(8, 10)) - 1];
    if (row) row[reading.slot] = reading.value;
  }
  return rows;
}

export default function MonthChart({ readings, from, to }) {
  if (readings.length === 0) return <p className="empty">No readings this month to chart yet.</p>;
  const rows = toChartRows(readings, from, to);

  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <ReferenceArea y1={70} y2={180} fill="#16a34a" fillOpacity={0.08} />
          <XAxis dataKey="day" />
          <YAxis domain={[40, 'auto']} unit="" width={40} />
          <Tooltip labelFormatter={(day) => `Day ${day}`} formatter={(value) => `${value} mg/dl`} />
          <Legend />
          {SLOTS.map((slot) => (
            <Line
              key={slot.key}
              type="monotone"
              dataKey={slot.key}
              name={slot.label}
              stroke={SLOT_COLORS[slot.key]}
              connectNulls
              dot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <p className="chart-note">Shaded band: 70–180 mg/dl, the commonly used target range.</p>
    </div>
  );
}
