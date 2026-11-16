import { useEffect, useId, useRef, useState } from 'react';
import { formatMonth, shiftMonth, todayIso } from '../constants';
import Chevron from './Chevron';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

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

function monthCells(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  const first = new Date(Date.UTC(year, monthNumber - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const leadingBlanks = (first.getUTCDay() + 6) % 7;
  const cells = Array.from({ length: leadingBlanks }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(`${month}-${String(day).padStart(2, '0')}`);
  }
  return cells;
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  );
}

function Calendar({ value, onSelect, onClose }) {
  const today = todayIso();
  const [focused, setFocused] = useState(value || today);
  const [month, setMonth] = useState((value || today).slice(0, 7));
  const gridRef = useRef(null);

  useEffect(() => {
    gridRef.current?.querySelector(`[data-date="${focused}"]`)?.focus();
  }, [focused, month]);

  function moveFocus(delta) {
    const next = shiftDay(focused, delta);
    if (next > today) return;
    setFocused(next);
    setMonth(next.slice(0, 7));
  }

  function changeMonth(delta) {
    const nextMonth = shiftMonth(month, delta);
    const day = Math.min(Number(focused.slice(8, 10)), monthCells(nextMonth).filter(Boolean).length);
    const candidate = `${nextMonth}-${String(day).padStart(2, '0')}`;
    setMonth(nextMonth);
    setFocused(candidate > today ? today : candidate);
  }

  function handleKeyDown(event) {
    const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (event.key in moves) {
      event.preventDefault();
      moveFocus(moves[event.key]);
    } else if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault();
      changeMonth(event.key === 'PageUp' ? -1 : 1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  }

  const canGoForward = month < today.slice(0, 7);

  return (
    <div className="calendar" role="dialog" aria-label="Choose a date" onKeyDown={handleKeyDown}>
      <div className="calendar-header">
        <button type="button" className="calendar-nav" onClick={() => changeMonth(-1)} aria-label="Previous month">
          <Chevron direction="left" />
        </button>
        <strong aria-live="polite">{formatMonth(month)}</strong>
        <button type="button" className="calendar-nav" onClick={() => changeMonth(1)} disabled={!canGoForward} aria-label="Next month">
          <Chevron direction="right" />
        </button>
      </div>
      <div className="calendar-grid" ref={gridRef}>
        {WEEKDAYS.map((day) => (
          <span key={day} className="calendar-weekday" aria-hidden="true">
            {day}
          </span>
        ))}
        {monthCells(month).map((date, index) =>
          date ? (
            <button
              key={date}
              type="button"
              data-date={date}
              className={['calendar-day', date === value && 'is-selected', date === today && 'is-today']
                .filter(Boolean)
                .join(' ')}
              tabIndex={date === focused ? 0 : -1}
              disabled={date > today}
              aria-pressed={date === value}
              aria-label={formatLong(date)}
              onClick={() => onSelect(date)}
            >
              {Number(date.slice(8, 10))}
            </button>
          ) : (
            <span key={`blank-${index}`} aria-hidden="true" />
          ),
        )}
      </div>
    </div>
  );
}

export default function DateField({ label, value, onChange, error, stepper = false }) {
  const id = useId();
  const labelId = `${id}-label`;
  const valueId = `${id}-value`;
  const errorId = `${id}-error`;
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const today = todayIso();
  const yesterday = shiftDay(today, -1);
  const canGoForward = value && value < today;
  const invalid = Boolean(error);

  useEffect(() => {
    if (!open) return undefined;
    function closeOnOutsideClick(event) {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [open]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function select(date) {
    onChange(date);
    close();
  }

  const quickPick = (date, text) => (
    <button type="button" className="chip" aria-pressed={value === date} onClick={() => onChange(date)}>
      {text}
    </button>
  );

  return (
    <div className="date-field" ref={containerRef}>
      <span className="field-label" id={labelId}>
        {label}
      </span>
      <div className="date-field-row">
        {stepper && (
          <button type="button" className="secondary icon-button" onClick={() => onChange(shiftDay(value, -1))} aria-label="Previous day">
            <Chevron direction="left" />
          </button>
        )}
        <div className="date-trigger-wrap">
          <button
            type="button"
            ref={triggerRef}
            className={`date-trigger${invalid ? ' is-invalid' : ''}`}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-labelledby={`${labelId} ${valueId}`}
            aria-invalid={invalid ? 'true' : undefined}
            aria-describedby={invalid ? errorId : undefined}
            onClick={() => setOpen((isOpen) => !isOpen)}
          >
            <CalendarIcon />
            <span id={valueId}>{formatLong(value)}</span>
          </button>
          {open && <Calendar value={value} onSelect={select} onClose={close} />}
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
