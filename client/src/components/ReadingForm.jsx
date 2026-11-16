import { useState } from 'react';
import { SLOTS, todayIso } from '../constants';
import FormError from './FormError';

export function validateReading({ date, value }) {
  if (String(value).trim() === '') return { field: 'value', message: 'Please enter a glucose value.' };
  const number = Number(value);
  if (!Number.isInteger(number) || number < 40 || number > 600) {
    return { field: 'value', message: 'Value must be between 40 and 600 mg/dl.' };
  }
  if (!date) return { field: 'date', message: 'Please choose a date.' };
  if (date > todayIso()) return { field: 'date', message: 'Date cannot be in the future.' };
  return null;
}

function initialForm(reading, preset) {
  if (reading) return { date: reading.date, slot: reading.slot, value: String(reading.value) };
  return { date: preset?.date ?? todayIso(), slot: preset?.slot ?? SLOTS[0].key, value: '' };
}

export default function ReadingForm({ reading, preset, onSave, onCancel, onDelete, autoFocus = false }) {
  const [form, setForm] = useState(() => initialForm(reading, preset));
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(reading);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });
  const invalid = (field) => (error?.field === field ? 'true' : undefined);

  async function handleSubmit(event) {
    event.preventDefault();
    const problem = validateReading(form);
    if (problem) {
      setError(problem);
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
        <input type="date" value={form.date} max={todayIso()} onChange={update('date')} aria-invalid={invalid('date')} />
      </label>
      <label>
        Time slot
        <select value={form.slot} onChange={update('slot')} aria-invalid={invalid('slot')}>
          {SLOTS.map((slot) => (
            <option key={slot.key} value={slot.key}>
              {slot.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Glucose (mg/dl)
        <input
          type="number"
          inputMode="numeric"
          step="1"
          placeholder="e.g. 110"
          value={form.value}
          onChange={update('value')}
          aria-invalid={invalid('value')}
          autoFocus={autoFocus}
        />
      </label>
      <button type="submit" disabled={saving}>
        {isEdit ? 'Save changes' : 'Add reading'}
      </button>
      <FormError error={error} />
      {isEdit && (
        <div className="reading-form-footer">
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="danger" onClick={onDelete}>
            Delete reading
          </button>
        </div>
      )}
    </form>
  );
}
