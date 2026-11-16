import { useEffect, useState } from 'react';
import { api } from '../api';
import { todayIso } from '../constants';
import ReportView from './ReportView';
import MonthChart from './MonthChart';
import FormError from './FormError';
import DateField from './DateField';

export default function ReportSection({ reportsPath, readingsPath }) {
  const [date, setDate] = useState(todayIso());
  const [data, setData] = useState({ report: null, monthReadings: null, error: null });

  useEffect(() => {
    if (!date) return;
    const monthStart = `${date.slice(0, 8)}01`;
    Promise.all([
      api(`${reportsPath}date=${date}`),
      api(`${readingsPath}from=${monthStart}&to=${date}&limit=200`),
    ])
      .then(([report, readingData]) => setData({ report, monthReadings: readingData.readings, error: null }))
      .catch((error) => setData((previous) => ({ ...previous, error })));
  }, [date, reportsPath, readingsPath]);

  return (
    <>
      <div className="report-toolbar">
        <DateField label="Report date" value={date} onChange={setDate} stepper />
      </div>
      <FormError error={data.error} />
      {data.report ? <ReportView report={data.report} /> : !data.error && <p className="loading">Loading report…</p>}
      <section className="panel" aria-labelledby="chart-heading">
        <h2 id="chart-heading">Readings this month</h2>
        {data.monthReadings ? <MonthChart readings={data.monthReadings} to={date} /> : <div className="skeleton" aria-label="Loading chart" />}
      </section>
    </>
  );
}
