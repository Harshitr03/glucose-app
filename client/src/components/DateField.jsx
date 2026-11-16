import { useId } from 'react';
import { todayIso } from '../constants';
import Chevron from './Chevron';

function shiftDay(iso, delta) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

function formatLong(iso) {
  if (!iso) return 'Choose a date';
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}


function openPicker(event) {
  try {
    event.currentTarget.showPicker?.();
  } catch {
    // Some browsers refuse showPicker outside a direct click; the native input still works.
  }
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  );
}

export default function DateField({ label, value, onChange, error, stepper = false }) {
  const id = useId();
  const errorId = `${id}-error`;
  const invalid = Boolean(error);
  const today = todayIso();
  const yesterday = shiftDay(today, -1);
  const canGoForward = value && value < today;

  const quickPick = (date, text) => (
    <button type="button" className="chip" aria-pressed={value === date} onClick={() => onChange(date)}>
      {text}
    </button>
  );

  return (
    <div className="date-field">
      <label htmlFor={id}>{label}</label>
      <div className="date-field-row">
        {stepper && (
          <button type="button" className="secondary icon-button" onClick={() => onChange(shiftDay(value, -1))} aria-label="Previous day">
            <Chevron direction="left" />
          </button>
        )}
        <div className={`date-display${invalid ? ' is-invalid' : ''}`}>
          <CalendarIcon />
          <span>{formatLong(value)}</span>
          <input
            id={id}
            type="date"
            value={value}
            max={today}
            onChange={(event) => event.target.value && onChange(event.target.value)}
            onClick={openPicker}
            aria-invalid={invalid ? 'true' : undefined}
            aria-describedby={invalid ? errorId : undefined}
          />
        </div>
        {stepper && (
          <button
            type="button"
            className="secondary icon-button"
            onClick={() => onChange(shiftDay(value, 1))}
            disabled={!canGoForward}
            aria-label="Next day"
          >
            <Chevron direction="right" />
          </button>
        )}
      </div>
      {invalid && (
        <p className="field-error" id={errorId}>
          {error}
        </p>
      )}
      <div className="date-field-chips">
        {quickPick(today, 'Today')}
        {quickPick(yesterday, 'Yesterday')}
      </div>
    </div>
  );
}
