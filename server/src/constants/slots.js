const SLOTS = [
  { key: 'morning_fasting', label: 'Morning (fasting)' },
  { key: 'after_breakfast', label: 'After breakfast' },
  { key: 'after_lunch', label: 'After lunch' },
  { key: 'after_dinner', label: 'After dinner' },
];

const SLOT_KEYS = SLOTS.map((slot) => slot.key);
const MAX_READINGS_PER_DAY = SLOTS.length;

function slotLabel(key) {
  return SLOTS.find((slot) => slot.key === key)?.label ?? key;
}

module.exports = { SLOTS, SLOT_KEYS, MAX_READINGS_PER_DAY, slotLabel };
