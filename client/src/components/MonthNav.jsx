import { formatMonth, shiftMonth, todayIso } from '../constants';
import Chevron from './Chevron';


export default function MonthNav({ month, onChange }) {
  const isCurrentMonth = month >= todayIso().slice(0, 7);

  return (
    <div className="month-nav">
      <button type="button" className="secondary icon-button" onClick={() => onChange(shiftMonth(month, -1))} aria-label="Previous month">
        <Chevron direction="left" />
      </button>
      <strong aria-live="polite">{formatMonth(month)}</strong>
      <button
        type="button"
        className="secondary icon-button"
        onClick={() => onChange(shiftMonth(month, 1))}
        disabled={isCurrentMonth}
        aria-label="Next month"
      >
        <Chevron direction="right" />
      </button>
    </div>
  );
}
