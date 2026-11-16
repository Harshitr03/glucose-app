import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { isIsoDate, shiftDay, todayIso } from '../constants';
import ReportView from './ReportView';
import MonthChart from './MonthChart';
import FormError from './FormError';
import DateField from './DateField';
import Segmented from './Segmented';

const CHART_RANGES = [
  { value: 'month', label: 'This month', title: 'Readings this month' },
  { value: '7', label: '7 days', title: 'Readings over the last 7 days' },
  { value: '30', label: '30 days', title: 'Readings over the last 30 days' },
];

function chartStart(range, date) {
  if (range === 'month') return `${date.slice(0, 8)}01`;
  return shiftDay(date, 1 - Number(range));
}

export default function ReportSection({ reportsPath, readingsPath }) {
  const today = todayIso();
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const date = dateParam && isIsoDate(dateParam) && dateParam <= today ? dateParam : today;
  const [range, setRange] = useState('month');
  const [data, setData] = useState({ report: null, chartReadings: null, error: null });

  function setDate(nextDate) {
    setSearchParams(
      (params) => {
        if (nextDate === today) params.delete('date');
        else params.set('date', nextDate);
        return params;
      },
      { replace: true },
    );
  }

  useEffect(() => {
    const from = chartStart(range, date);
    Promise.all([api(`${reportsPath}date=${date}`), api(`${readingsPath}from=${from}&to=${date}&limit=200`)])
      .then(([report, readingData]) => setData({ report, chartReadings: readingData.readings, error: null }))
      .catch((error) => setData((previous) => ({ ...previous, error })));
  }, [date, range, reportsPath, readingsPath]);

  const chartTitle = CHART_RANGES.find((option) => option.value === range).title;

  return (
    <>
      <div className="report-toolbar">
        <DateField label="Report date" value={date} onChange={setDate} stepper />
      </div>
      <FormError error={data.error} />
      {data.report ? <ReportView report={data.report} /> : !data.error && <p className="loading">Loading report…</p>}
      <section className="panel" aria-labelledby="chart-heading">
        <div className="section-header">
          <h2 id="chart-heading">{chartTitle}</h2>
          <Segmented label="Chart period" options={CHART_RANGES} value={range} onChange={setRange} />
        </div>
        {data.chartReadings ? (
          <MonthChart readings={data.chartReadings} to={date} />
        ) : (
          <div className="skeleton" aria-label="Loading chart" />
        )}
      </section>
    </>
  );
}
