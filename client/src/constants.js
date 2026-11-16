export const SLOTS = [
  { key: 'morning_fasting', label: 'Morning (fasting)', short: 'Morning', color: '#E0893A', line: '#C46F1E', shape: 'circle', fromHour: 0 },
  { key: 'after_breakfast', label: 'After breakfast', short: 'Breakfast', color: '#C9A227', line: '#A88512', shape: 'square', fromHour: 9 },
  { key: 'after_lunch', label: 'After lunch', short: 'Lunch', color: '#2F9C88', line: '#2F9C88', shape: 'triangle', fromHour: 13 },
  { key: 'after_dinner', label: 'After dinner', short: 'Dinner', color: '#4B4FA8', line: '#4B4FA8', shape: 'diamond', fromHour: 19 },
];

// Prefer the slot for the current time of day, then later empty slots, then any missed earlier ones.
export function suggestSlot(takenSlots, hour = new Date().getHours()) {
  const current = SLOTS.findLastIndex((slot) => hour >= slot.fromHour);
  const ordered = [...SLOTS.slice(current), ...SLOTS.slice(0, current)];
  return (ordered.find((slot) => !takenSlots.includes(slot.key)) ?? SLOTS[0]).key;
}

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

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value) {
  return ISO_DATE.test(value) && new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);
}

export function shiftDay(iso, delta) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

function parseIso(iso) {
  return new Date(`${iso}T00:00:00`);
}

export function formatDate(iso) {
  return parseIso(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
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
