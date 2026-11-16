import { SLOTS, formatDayMonth, formatWeekday, rangeStatus, todayIso } from '../constants';
import RangeFlag from './RangeFlag';

function groupByDate(readings, order) {
  const byDate = new Map();
  for (const reading of readings) {
    if (!byDate.has(reading.date)) byDate.set(reading.date, {});
    byDate.get(reading.date)[reading.slot] = reading;
  }
  const dates = [...byDate.keys()].sort();
  if (order === 'newest') dates.reverse();
  return dates.map((date) => ({ date, slots: byDate.get(date) }));
}

function ValueCell({ reading, slot, onSelect }) {
  if (!reading) return <span className="no-value" aria-label="No reading">–</span>;
  const content = (
    <>
      {reading.value}
      <RangeFlag status={rangeStatus(reading.value)} />
    </>
  );
  if (!onSelect) return content;
  return (
    <button
      type="button"
      className="value-button"
      onClick={() => onSelect(reading)}
      aria-label={`Edit ${slot.label} reading, ${reading.value} mg/dl`}
    >
      {content}
    </button>
  );
}

export default function Logbook({ readings, order = 'oldest', onSelect, emptyText }) {
  if (readings === null) return null;
  if (readings.length === 0) return <p className="empty">{emptyText}</p>;
  const today = todayIso();

  return (
    <div className="logbook-wrap">
      <table className="logbook">
        <thead>
          <tr>
            <th scope="col">Date</th>
            {SLOTS.map((slot) => (
              <th key={slot.key} scope="col" className="slot-col" style={{ '--slot': slot.color }}>
                {slot.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groupByDate(readings, order).map(({ date, slots }) => (
            <tr key={date} className={date === today ? 'is-today' : undefined}>
              <th scope="row" className="date-cell">
                {formatDayMonth(date)}
                <span>{date === today ? 'Today' : formatWeekday(date)}</span>
              </th>
              {SLOTS.map((slot) => (
                <td key={slot.key} className="value-cell" style={{ '--slot': slot.color }}>
                  <ValueCell reading={slots[slot.key]} slot={slot} onSelect={onSelect} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
