import { useId, useState } from 'react';
import { SLOTS, todayIso } from '../constants';
import FormError from './FormError';
import DateField from './DateField';
import SlotMarker from './SlotMarker';

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

const FIELDS = ['date', 'slot', 'value'];

export default function ReadingForm({ reading, preset, onSave, onCancel, onDelete, autoFocus = false }) {
  const id = useId();
  const [form, setForm] = useState(() => initialForm(reading, preset));
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(reading);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });
  const fieldError = (field) => (error?.field === field ? error.message : null);
  const errorProps = (field) =>
    fieldError(field) ? { 'aria-invalid': 'true', 'aria-describedby': `${id}-${field}-error` } : {};
  const generalError = error && !FIELDS.includes(error.field) ? error : null;

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

  function renderFieldError(field) {
    const message = fieldError(field);
    if (!message) return null;
    return (
      <p className="field-error" id={`${id}-${field}-error`}>
        {message}
      </p>
    );
  }

  return (
    <form className="reading-form" onSubmit={handleSubmit} noValidate aria-label={isEdit ? 'Edit reading' : 'Add reading'}>
      <DateField label="Date" value={form.date} onChange={(date) => setForm({ ...form, date })} error={fieldError('date')} />
      <fieldset className="slot-picker" role="radiogroup" {...errorProps('slot')}>
        <legend className="field-label">Time slot</legend>
        <div className="slot-options">
          {SLOTS.map((slot) => (
            <label key={slot.key} className="slot-option" style={{ '--slot': slot.color }}>
              <input
                type="radio"
                name={`${id}-slot`}
                value={slot.key}
                checked={form.slot === slot.key}
                onChange={update('slot')}
              />
              <SlotMarker shape={slot.shape} color={slot.line} />
              {slot.label}
            </label>
          ))}
        </div>
        {renderFieldError('slot')}
      </fieldset>
      <div className="field value-field">
        <label htmlFor={`${id}-value`}>Glucose (mg/dl)</label>
        <input
          id={`${id}-value`}
          type="number"
          inputMode="numeric"
          step="1"
          placeholder="e.g. 110"
          value={form.value}
          onChange={update('value')}
          autoFocus={autoFocus}
          {...errorProps('value')}
        />
        {renderFieldError('value')}
      </div>
      <button type="submit" disabled={saving}>
        {isEdit ? 'Save changes' : 'Add reading'}
      </button>
      <FormError error={generalError} />
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
