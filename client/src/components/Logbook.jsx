import { SLOTS, formatDayMonth, formatWeekday, rangeStatus, todayIso } from '../constants';
import RangeFlag from './RangeFlag';
import SlotMarker from './SlotMarker';

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

function Value({ reading, slot, onSelect }) {
  if (!reading) {
    return (
      <span className="no-value" aria-label="No reading">
        –
      </span>
    );
  }
  const status = rangeStatus(reading.value);
  const content = (
    <>
      <span className={status === 'in-range' ? undefined : `value-${status}`}>{reading.value}</span>
      <RangeFlag status={status} />
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

function dayLabel(date, today) {
  return date === today ? 'Today' : formatWeekday(date);
}

export default function Logbook({ readings, order = 'oldest', onSelect, emptyText }) {
  if (readings === null) return <p className="loading">Loading readings…</p>;
  if (readings.length === 0) return <p className="empty">{emptyText}</p>;
  const today = todayIso();
  const days = groupByDate(readings, order);

  return (
    <>
      <ul className="day-cards">
        {days.map(({ date, slots }) => (
          <li key={date} className={`day-card${date === today ? ' is-today' : ''}`}>
            <h3>
              {formatDayMonth(date)}
              <span>{dayLabel(date, today)}</span>
            </h3>
            <dl className="day-card-slots">
              {SLOTS.map((slot) => (
                <div key={slot.key} style={{ '--slot': slot.color }}>
                  <dt>
                    <SlotMarker shape={slot.shape} color={slot.line} size={10} />
                    {slot.short}
                  </dt>
                  <dd>
                    <Value reading={slots[slot.key]} slot={slot} onSelect={onSelect} />
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>

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
            {days.map(({ date, slots }) => (
              <tr key={date} className={date === today ? 'is-today' : undefined}>
                <th scope="row" className="date-cell">
                  {formatDayMonth(date)}
                  <span>{dayLabel(date, today)}</span>
                </th>
                {SLOTS.map((slot) => (
                  <td key={slot.key} className="value-cell" style={{ '--slot': slot.color }}>
                    <Value reading={slots[slot.key]} slot={slot} onSelect={onSelect} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
