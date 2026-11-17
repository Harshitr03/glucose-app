import { formatDate, shiftDay, slotLabel, todayIso } from '../constants';

function listSlots(slots) {
  const labels = slots.map(slotLabel);
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(', ')} and ${labels.at(-1)}`;
}

function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" strokeLinejoin="round" />
      <path d="M10.3 20a1.9 1.9 0 0 0 3.4 0" strokeLinecap="round" />
    </svg>
  );
}

export default function ReminderBanner({ reminder, onLog, onDismiss }) {
  const today = todayIso();
  const when = reminder.date === today ? 'today' : reminder.date === shiftDay(today, -1) ? 'yesterday' : formatDate(reminder.date);
  const [nextSlot] = reminder.missingSlots;
  const count = reminder.missingSlots.length;

  return (
    <section className="reminder-banner" aria-labelledby="reminder-heading">
      <BellIcon />
      <div className="reminder-text">
        <h2 id="reminder-heading">
          {count === 1 ? 'One reading' : `${count} readings`} missing {when}
        </h2>
        <p>
          {listSlots(reminder.missingSlots)}
          {reminder.date !== today && <span className="subtle"> on {formatDate(reminder.date)}</span>}
        </p>
      </div>
      <div className="reminder-actions">
        <button type="button" onClick={() => onLog(reminder.date, nextSlot)}>
          Log {slotLabel(nextSlot)}
        </button>
        <button type="button" className="link-button" onClick={() => onDismiss(reminder.id)}>
          Dismiss
        </button>
      </div>
    </section>
  );
}
