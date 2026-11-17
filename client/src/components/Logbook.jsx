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

function average(values) {
  if (values.length === 0) return null;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function averages(readings) {
  const bySlot = Object.fromEntries(
    SLOTS.map((slot) => {
      const values = readings.filter((reading) => reading.slot === slot.key).map((reading) => reading.value);
      return [slot.key, { average: average(values), count: values.length }];
    }),
  );
  return { bySlot, overall: average(readings.map((reading) => reading.value)), count: readings.length };
}

function Average({ value }) {
  if (value === null) {
    return (
      <span className="no-value" aria-label="No readings">
        –
      </span>
    );
  }
  const status = rangeStatus(value);
  return (
    <>
      <span className={status === 'in-range' ? undefined : `value-${status}`}>{value.toFixed(1)}</span>
      <RangeFlag status={status} />
    </>
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
  const summary = averages(readings);
  const countLabel = (count) => `${count} reading${count === 1 ? '' : 's'}`;

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
      <section className="logbook-averages" aria-label="Averages for these days">
        <h3>
          Average <Average value={summary.overall} />
          <span>{countLabel(summary.count)}</span>
        </h3>
        <dl>
          {SLOTS.map((slot) => (
            <div key={slot.key} style={{ '--slot': slot.color }}>
              <dt>
                <SlotMarker shape={slot.shape} color={slot.line} size={9} />
                {slot.short}
              </dt>
              <dd>
                <Average value={summary.bySlot[slot.key].average} />
              </dd>
            </div>
          ))}
        </dl>
      </section>

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
          <tfoot>
            <tr>
              <th scope="row" className="date-cell">
                <span className="foot-label">Average</span>
                <small>
                  {summary.overall.toFixed(1)} overall, {countLabel(summary.count)}
                </small>
              </th>
              {SLOTS.map((slot) => (
                <td key={slot.key} className="value-cell" style={{ '--slot': slot.color }}>
                  <Average value={summary.bySlot[slot.key].average} />
                  <small>{countLabel(summary.bySlot[slot.key].count)}</small>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}
