import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { ApiError } from '../api';
import { todayIso } from '../constants';
import ReadingForm, { validateReading } from './ReadingForm';

function shiftDay(iso, delta) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

function renderForm(props = {}) {
  const onSave = props.onSave ?? vi.fn().mockResolvedValue();
  const user = userEvent.setup();
  render(<ReadingForm onSave={onSave} {...props} />);
  return {
    user,
    onSave,
    valueInput: screen.getByLabelText('Glucose (mg/dl)'),
    dateInput: screen.getByLabelText('Date'),
    slotSelect: screen.getByLabelText('Time slot'),
    submit: () => user.click(screen.getByRole('button', { name: 'Add reading' })),
  };
}

describe('validateReading', () => {
  test.each([
    ['', 'Please enter a glucose value.'],
    ['39', 'Value must be between 40 and 600 mg/dl.'],
    ['601', 'Value must be between 40 and 600 mg/dl.'],
    ['120.5', 'Value must be between 40 and 600 mg/dl.'],
  ])('value %j gives "%s"', (value, message) => {
    expect(validateReading({ date: todayIso(), value })?.message).toBe(message);
  });

  test.each(['40', '600'])('accepts the boundary value %s', (value) => {
    expect(validateReading({ date: todayIso(), value })).toBeNull();
  });

  test('rejects a future date', () => {
    expect(validateReading({ date: shiftDay(todayIso(), 1), value: '120' })?.message).toBe('Date cannot be in the future.');
  });
});

describe('ReadingForm', () => {
  test('shows an error and does not save when the value is empty', async () => {
    const { submit, onSave, valueInput } = renderForm();

    await submit();

    expect(screen.getByText('Please enter a glucose value.')).toBeInTheDocument();
    expect(valueInput).toHaveAttribute('aria-invalid', 'true');
    expect(valueInput).toHaveAccessibleDescription('Please enter a glucose value.');
    expect(onSave).not.toHaveBeenCalled();
  });

  test('shows the range error for a value above 600', async () => {
    const { user, submit, valueInput, onSave } = renderForm();

    await user.type(valueInput, '601');
    await submit();

    expect(screen.getByText('Value must be between 40 and 600 mg/dl.')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  test('shows the future date error', async () => {
    const { user, submit, valueInput, dateInput } = renderForm();

    fireEvent.change(dateInput, { target: { value: shiftDay(todayIso(), 1) } });
    await user.type(valueInput, '120');
    await submit();

    expect(screen.getByText('Date cannot be in the future.')).toBeInTheDocument();
  });

  test('saves a valid reading as numbers and clears the value', async () => {
    const { user, submit, valueInput, slotSelect, onSave } = renderForm();

    await user.selectOptions(slotSelect, 'after_lunch');
    await user.type(valueInput, '142');
    await submit();

    expect(onSave).toHaveBeenCalledWith({ date: todayIso(), slot: 'after_lunch', value: 142 });
    expect(valueInput).toHaveValue(null);
  });

  test('the Yesterday button changes the date that is saved', async () => {
    const { user, submit, valueInput, onSave } = renderForm();

    await user.click(screen.getByRole('button', { name: 'Yesterday' }));
    await user.type(valueInput, '110');
    await submit();

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ date: shiftDay(todayIso(), -1) }));
  });

  test('shows a duplicate-slot error from the server under the slot field', async () => {
    const message = 'You already have an After lunch reading for this date.';
    const onSave = vi.fn().mockRejectedValue(new ApiError(400, message, 'slot'));
    const { user, submit, valueInput, slotSelect } = renderForm({ onSave });

    await user.type(valueInput, '150');
    await submit();

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(slotSelect).toHaveAccessibleDescription(message);
  });

  test('shows the daily limit error from the server for the whole form', async () => {
    const message = 'You can add only 4 readings per day.';
    const onSave = vi.fn().mockRejectedValue(new ApiError(400, message));
    const { user, submit, valueInput } = renderForm({ onSave });

    await user.type(valueInput, '150');
    await submit();

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
  });

  test('starts from the preset slot when one is picked from the Today strip', () => {
    renderForm({ preset: { date: todayIso(), slot: 'after_dinner' } });
    expect(screen.getByLabelText('Time slot')).toHaveValue('after_dinner');
  });

  test('edit mode is filled in and offers save, cancel and delete', async () => {
    const onCancel = vi.fn();
    const onDelete = vi.fn();
    const onSave = vi.fn().mockResolvedValue();
    const reading = { id: 7, date: '2026-10-15', slot: 'after_breakfast', value: 165 };
    const user = userEvent.setup();
    render(<ReadingForm reading={reading} onSave={onSave} onCancel={onCancel} onDelete={onDelete} />);

    expect(screen.getByLabelText('Glucose (mg/dl)')).toHaveValue(165);
    expect(screen.getByLabelText('Time slot')).toHaveValue('after_breakfast');

    await user.clear(screen.getByLabelText('Glucose (mg/dl)'));
    await user.type(screen.getByLabelText('Glucose (mg/dl)'), '170');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.click(screen.getByRole('button', { name: 'Delete reading' }));

    expect(onSave).toHaveBeenCalledWith({ date: '2026-10-15', slot: 'after_breakfast', value: 170 });
    expect(onCancel).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalled();
  });
});
