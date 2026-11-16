import { useEffect, useState } from 'react';
import { api } from '../api';
import { todayIso } from '../constants';
import ReportView from './ReportView';
import MonthChart from './MonthChart';
import FormError from './FormError';

export default function ReportSection({ reportsPath, readingsPath }) {
  const [date, setDate] = useState(todayIso());
  const [report, setReport] = useState(null);
  const [monthReadings, setMonthReadings] = useState([]);
  const [error, setError] = useState(null);

  const monthStart = `${date.slice(0, 8)}01`;

  useEffect(() => {
    if (!date) return;
    setError(null);
    Promise.all([
      api(`${reportsPath}date=${date}`),
      api(`${readingsPath}from=${monthStart}&to=${date}&limit=200`),
    ])
      .then(([reportData, readingData]) => {
        setReport(reportData);
        setMonthReadings(readingData.readings);
      })
      .catch(setError);
  }, [date, monthStart, reportsPath, readingsPath]);

  return (
    <>
      <label className="date-picker">
        Report date
        <input type="date" value={date} max={todayIso()} onChange={(event) => setDate(event.target.value)} />
      </label>
      <FormError error={error} />
      {report && <ReportView report={report} />}
      <section className="panel">
        <h2>This month</h2>
        <MonthChart readings={monthReadings} from={monthStart} to={date} />
      </section>
    </>
  );
}
