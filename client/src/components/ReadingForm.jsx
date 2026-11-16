import { useState } from 'react';
import { SLOTS, todayIso } from '../constants';
import FormError from './FormError';

function emptyForm() {
  return { date: todayIso(), slot: SLOTS[0].key, value: '' };
}

export function validateReading({ date, value }) {
  if (String(value).trim() === '') return 'Please enter a glucose value.';
  const number = Number(value);
  if (!Number.isInteger(number) || number < 40 || number > 600) return 'Value must be between 40 and 600 mg/dl.';
  if (!date) return 'Please choose a date.';
  if (date > todayIso()) return 'Date cannot be in the future.';
  return null;
}

export default function ReadingForm({ reading, onSave, onCancel }) {
  const [form, setForm] = useState(() => (reading ? { ...reading, value: String(reading.value) } : emptyForm()));
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(reading);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  async function handleSubmit(event) {
    event.preventDefault();
    const message = validateReading(form);
    if (message) {
      setError({ message });
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({ date: form.date, slot: form.slot, value: Number(form.value) });
      if (!isEdit) setForm({ ...form, value: '' });
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="reading-form" onSubmit={handleSubmit} noValidate aria-label={isEdit ? 'Edit reading' : 'Add reading'}>
      <label>
        Date
        <input type="date" value={form.date} max={todayIso()} onChange={update('date')} />
      </label>
      <label>
        Time slot
        <select value={form.slot} onChange={update('slot')}>
          {SLOTS.map((slot) => (
            <option key={slot.key} value={slot.key}>
              {slot.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Glucose (mg/dl)
        <input type="number" inputMode="numeric" step="1" value={form.value} onChange={update('value')} />
      </label>
      <div className="form-actions">
        <button type="submit" disabled={saving}>
          {isEdit ? 'Save changes' : 'Add reading'}
        </button>
        {isEdit && (
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
      <FormError error={error} />
    </form>
  );
}
