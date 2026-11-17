import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { useFeedback } from '../../feedback/FeedbackContext';
import { formatDate, monthRange, slotLabel, suggestSlot, todayIso } from '../../constants';
import DayStrip from '../../components/DayStrip';
import ReadingForm from '../../components/ReadingForm';
import Logbook from '../../components/Logbook';
import MonthNav from '../../components/MonthNav';
import OrderToggle from '../../components/OrderToggle';
import FormError from '../../components/FormError';
import ReminderBanner from '../../components/ReminderBanner';
import useDocumentTitle from '../../useDocumentTitle';

const MONTH_PATTERN = /^\d{4}-\d{2}$/;
const FLASH_MS = 1600;

export default function ReadingsPage() {
  useDocumentTitle('Readings');
  const { user } = useAuth();
  const { showToast } = useFeedback();
  const today = todayIso();
  const [searchParams, setSearchParams] = useSearchParams();
  const monthParam = searchParams.get('month');
  const month = monthParam && MONTH_PATTERN.test(monthParam) && monthParam <= today.slice(0, 7) ? monthParam : today.slice(0, 7);

  const [todayReadings, setTodayReadings] = useState(null);
  const [monthReadings, setMonthReadings] = useState(null);
  const [hasAnyReadings, setHasAnyReadings] = useState(null);
  const [reminder, setReminder] = useState(null);
  const [order, setOrder] = useState('oldest');
  const [editing, setEditing] = useState(null);
  const [preset, setPreset] = useState(null);
  const [flashSlot, setFlashSlot] = useState(null);
  const [error, setError] = useState(null);
  const formRef = useRef(null);

  const load = useCallback(() => {
    const { from, to } = monthRange(month);
    Promise.all([
      api(`/readings?from=${today}&to=${today}`),
      api(`/readings?from=${from}&to=${to}&limit=200`),
      api('/readings?limit=1'),
      api('/reminder'),
    ])
      .then(([todayData, monthData, anyData, reminderData]) => {
        setTodayReadings(todayData.readings);
        setMonthReadings(monthData.readings);
        setHasAnyReadings(anyData.total > 0);
        setReminder(reminderData.reminder);
      })
      .catch(setError);
  }, [month, today]);

  useEffect(load, [load]);

  useEffect(() => {
    if (!flashSlot) return undefined;
    const timer = setTimeout(() => setFlashSlot(null), FLASH_MS);
    return () => clearTimeout(timer);
  }, [flashSlot]);

  function setMonth(nextMonth) {
    setSearchParams(nextMonth === today.slice(0, 7) ? {} : { month: nextMonth }, { replace: true });
  }

  function startEdit(reading) {
    setPreset(null);
    setEditing(reading);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function pickSlot(slot, reading) {
    if (reading) {
      startEdit(reading);
      return;
    }
    setEditing(null);
    setPreset({ date: today, slot });
  }

  function logMissed(date, slot) {
    setEditing(null);
    setPreset({ date, slot });
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function dismissReminder(id) {
    setReminder(null);
    try {
      await api(`/reminder/dismiss?id=${id}`, { method: 'POST' });
    } catch (err) {
      showToast(err.message);
      load();
    }
  }

  function resetForm() {
    setEditing(null);
    setPreset(null);
  }

  function confirmSaved(values, verb) {
    const when = values.date === today ? '' : ` on ${formatDate(values.date)}`;
    showToast(`${verb} ${values.value} mg/dl for ${slotLabel(values.slot)}${when}.`);
    if (values.date === today) setFlashSlot(values.slot);
  }

  async function addReading(values) {
    await api('/readings', { method: 'POST', body: values });
    setPreset(null);
    confirmSaved(values, 'Saved');
    load();
  }

  async function saveEdit(values) {
    await api(`/reading?id=${editing.id}`, { method: 'PUT', body: values });
    resetForm();
    confirmSaved(values, 'Updated to');
    load();
  }

  async function restore(reading) {
    try {
      await api('/readings', { method: 'POST', body: { date: reading.date, slot: reading.slot, value: reading.value } });
      showToast('Reading restored.');
      load();
    } catch (err) {
      showToast(err.message);
    }
  }

  async function deleteEditing() {
    const reading = editing;
    try {
      await api(`/reading?id=${reading.id}`, { method: 'DELETE' });
      resetForm();
      load();
      showToast(`Deleted the ${slotLabel(reading.slot)} reading from ${formatDate(reading.date)}.`, {
        label: 'Undo',
        onClick: () => restore(reading),
      });
    } catch (err) {
      setError(err);
    }
  }

  const takenToday = (todayReadings ?? []).map((reading) => reading.slot);
  const formPreset = preset ?? { date: today, slot: suggestSlot(takenToday) };
  const formKey = editing ? `edit-${editing.id}` : `new-${formPreset.date}-${formPreset.slot}`;
  const firstName = user.name.split(' ')[0];

  return (
    <>
      <header className="page-header">
        <h1>Readings</h1>
        <p className="subtle">Today is {formatDate(today)}</p>
      </header>

      {hasAnyReadings === false && (
        <section className="panel welcome" aria-labelledby="welcome-heading">
          <h2 id="welcome-heading">Welcome, {firstName}</h2>
          <p>
            Log up to four readings a day: fasting in the morning, then after each meal. Add your first one below. Your
            daily and monthly reports fill in as you go.
          </p>
        </section>
      )}

      {reminder && <ReminderBanner reminder={reminder} onLog={logMissed} onDismiss={dismissReminder} />}

      <section className="section" aria-labelledby="today-heading">
        <h2 id="today-heading">Today</h2>
        <DayStrip
          readings={todayReadings ?? []}
          selectedSlot={editing?.date === today ? editing.slot : preset?.date === today ? preset.slot : undefined}
          flashSlot={flashSlot}
          onPick={pickSlot}
        />
      </section>

      <section className="panel" ref={formRef} aria-labelledby="form-heading">
        <h2 id="form-heading">{editing ? `Edit reading from ${formatDate(editing.date)}` : 'Add a reading'}</h2>
        {todayReadings && (
          <ReadingForm
            key={formKey}
            reading={editing}
            preset={formPreset}
            autoFocus={Boolean(editing || preset)}
            onSave={editing ? saveEdit : addReading}
            onCancel={resetForm}
            onDelete={deleteEditing}
          />
        )}
      </section>

      <section className="section" aria-labelledby="logbook-heading">
        <div className="section-header">
          <h2 id="logbook-heading">Logbook</h2>
          <div className="logbook-controls">
            <OrderToggle order={order} onChange={setOrder} />
            <MonthNav month={month} onChange={setMonth} />
          </div>
        </div>
        <FormError error={error} />
        <Logbook
          readings={monthReadings}
          order={order}
          onSelect={startEdit}
          emptyText="No readings this month. Add one above and it will show up here."
        />
      </section>
    </>
  );
}
