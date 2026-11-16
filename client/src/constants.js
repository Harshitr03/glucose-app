export const SLOTS = [
  { key: 'morning_fasting', label: 'Morning (fasting)', short: 'Morning', color: '#E0893A' },
  { key: 'after_breakfast', label: 'After breakfast', short: 'Breakfast', color: '#C9A227' },
  { key: 'after_lunch', label: 'After lunch', short: 'Lunch', color: '#2F9C88' },
  { key: 'after_dinner', label: 'After dinner', short: 'Dinner', color: '#4B4FA8' },
];

export const TARGET_RANGE = { low: 70, high: 180 };

export function slotLabel(key) {
  return SLOTS.find((slot) => slot.key === key)?.label ?? key;
}

export function rangeStatus(value) {
  if (value < TARGET_RANGE.low) return 'low';
  if (value > TARGET_RANGE.high) return 'high';
  return 'in-range';
}

export function todayIso() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

function parseIso(iso) {
  return new Date(`${iso}T00:00:00`);
}

export function formatDate(iso) {
  return parseIso(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDayMonth(iso) {
  return parseIso(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function formatWeekday(iso) {
  return parseIso(iso).toLocaleDateString('en-GB', { weekday: 'short' });
}

export function monthRange(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const to = `${month}-${String(lastDay).padStart(2, '0')}`;
  const today = todayIso();
  return { from: `${month}-01`, to: to > today ? today : to };
}

export function shiftMonth(month, delta) {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));
  return date.toISOString().slice(0, 7);
}

export function formatMonth(month) {
  return parseIso(`${month}-01`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}
