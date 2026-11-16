import { SLOTS, rangeStatus } from '../constants';
import RangeFlag from './RangeFlag';

export default function DayStrip({ readings, selectedSlot, onPick }) {
  const bySlot = Object.fromEntries(readings.map((reading) => [reading.slot, reading]));

  return (
    <div className="day-strip">
      {SLOTS.map((slot) => {
        const reading = bySlot[slot.key];
        const classes = ['slot-tile', reading ? '' : 'is-empty', selectedSlot === slot.key ? 'is-selected' : '']
          .filter(Boolean)
          .join(' ');
        return (
          <button
            key={slot.key}
            type="button"
            className={classes}
            style={{ '--slot': slot.color }}
            onClick={() => onPick(slot.key, reading)}
            aria-label={reading ? `${slot.label}: ${reading.value} mg/dl. Edit` : `${slot.label}: no reading. Add`}
          >
            <span className="slot-tile-label">{slot.label}</span>
            {reading ? (
              <span className="slot-tile-value">
                {reading.value}
                <small>mg/dl</small>
                <RangeFlag status={rangeStatus(reading.value)} />
              </span>
            ) : (
              <span className="slot-tile-add">Add reading</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
