import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { SLOTS, TARGET_RANGE, formatDayMonth } from '../constants';
import SlotMarker, { markerPath } from './SlotMarker';

function markerDot(slot, size) {
  return function Dot({ cx, cy, index }) {
    if (cx == null || cy == null) return null;
    return <path key={index} d={markerPath(slot.shape, cx, cy, size)} fill={slot.line} stroke="#fff" strokeWidth={1} />;
  };
}

function eachDate(from, to) {
  const dates = [];
  const cursor = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export function toChartRows(readings, to) {
  if (readings.length === 0) return [];
  const firstDate = readings.reduce((min, reading) => (reading.date < min ? reading.date : min), readings[0].date);
  const rows = new Map(eachDate(firstDate, to).map((date) => [date, { date }]));
  for (const reading of readings) {
    const row = rows.get(reading.date);
    if (row) row[reading.slot] = reading.value;
  }
  return [...rows.values()];
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <strong>{formatDayMonth(label)}</strong>
      <ul>
        {payload.map((entry) => (
          <li key={entry.dataKey}>
            <span>{entry.name}</span>
            <strong>{entry.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MonthChart({ readings, to }) {
  const rows = toChartRows(readings, to);
  if (rows.length === 0) return <p className="empty">No readings in this period yet, so there is nothing to chart.</p>;
  const highest = Math.max(...readings.map((reading) => reading.value));
  const yMax = Math.max(250, Math.ceil((highest + 20) / 50) * 50);
  const yTicks = [TARGET_RANGE.low, TARGET_RANGE.high];
  for (let tick = 250; tick <= yMax; tick += 50) yTicks.push(tick);

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
          <CartesianGrid stroke="#e3e6ec" vertical={false} />
          <ReferenceArea y1={TARGET_RANGE.low} y2={TARGET_RANGE.high} fill="#1e7b4f" fillOpacity={0.07} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDayMonth}
            tick={{ fill: '#5b6475', fontSize: 13 }}
            tickLine={false}
            axisLine={{ stroke: '#e3e6ec' }}
            minTickGap={24}
          />
          <YAxis
            domain={[40, yMax]}
            ticks={yTicks}
            tick={{ fill: '#5b6475', fontSize: 13 }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip content={<ChartTooltip />} />
          {SLOTS.map((slot) => (
            <Line
              key={slot.key}
              type="linear"
              dataKey={slot.key}
              name={slot.label}
              stroke={slot.line}
              strokeWidth={2.5}
              connectNulls
              dot={markerDot(slot, 9)}
              activeDot={markerDot(slot, 13)}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="chart-legend">
        {SLOTS.map((slot) => (
          <span key={slot.key}>
            <SlotMarker shape={slot.shape} color={slot.line} />
            {slot.label}
          </span>
        ))}
        <span>
          <i className="band-key" aria-hidden="true" />
          Target range {TARGET_RANGE.low}–{TARGET_RANGE.high} mg/dl
        </span>
      </div>
    </div>
  );
}
