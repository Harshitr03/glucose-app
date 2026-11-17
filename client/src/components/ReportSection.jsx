import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { isIsoDate, shiftDay, todayIso } from '../constants';
import ReportView from './ReportView';
import MonthChart from './MonthChart';
import FormError from './FormError';
import DateField, { DateRangeField } from './DateField';
import Segmented from './Segmented';

const CHART_RANGES = [
  { value: 'month', label: 'This month', title: 'Readings this month' },
  { value: '7', label: '7 days', title: 'Readings over the last 7 days' },
  { value: '30', label: '30 days', title: 'Readings over the last 30 days' },
  { value: 'custom', label: 'Custom', title: 'Readings over chosen dates' },
];
const PAGE_LIMIT = 200;

function presetRange(range, date) {
  if (range === 'month') return { from: `${date.slice(0, 8)}01`, to: date };
  return { from: shiftDay(date, 1 - Number(range)), to: date };
}

async function fetchAllReadings(readingsPath, { from, to }) {
  const readings = [];
  for (let page = 1; ; page += 1) {
    const data = await api(`${readingsPath}from=${from}&to=${to}&limit=${PAGE_LIMIT}&page=${page}`);
    readings.push(...data.readings);
    if (readings.length >= data.total || data.readings.length === 0) return readings;
  }
}

export default function ReportSection({ reportsPath, readingsPath }) {
  const today = todayIso();
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const date = dateParam && isIsoDate(dateParam) && dateParam <= today ? dateParam : today;
  const [range, setRange] = useState('month');
  const [customRange, setCustomRange] = useState(null);
  const chartRange = range === 'custom' && customRange ? customRange : presetRange(range, date);
  const [report, setReport] = useState(null);
  const [chartReadings, setChartReadings] = useState(null);
  const [error, setError] = useState(null);

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

  function changeRange(nextRange) {
    if (nextRange === 'custom' && !customRange) setCustomRange(chartRange);
    setRange(nextRange);
  }

  useEffect(() => {
    let active = true;
    api(`${reportsPath}date=${date}`)
      .then((data) => {
        if (!active) return;
        setReport(data);
        setError(null);
      })
      .catch((err) => active && setError(err));
    return () => {
      active = false;
    };
  }, [date, reportsPath]);

  useEffect(() => {
    let active = true;
    fetchAllReadings(readingsPath, { from: chartRange.from, to: chartRange.to })
      .then((readings) => active && setChartReadings(readings))
      .catch((err) => active && setError(err));
    return () => {
      active = false;
    };
  }, [chartRange.from, chartRange.to, readingsPath]);

  const chartTitle = CHART_RANGES.find((option) => option.value === range).title;

  return (
    <>
      <div className="report-toolbar">
        <DateField label="Report date" value={date} onChange={setDate} stepper />
      </div>
      <FormError error={error} />
      {report ? <ReportView report={report} /> : !error && <p className="loading">Loading report…</p>}
      <section className="panel" aria-labelledby="chart-heading">
        <div className="section-header">
          <h2 id="chart-heading">{chartTitle}</h2>
          <div className="chart-controls">
            <Segmented label="Chart period" options={CHART_RANGES} value={range} onChange={changeRange} />
            {range === 'custom' && <DateRangeField label="Chart dates" value={chartRange} onChange={setCustomRange} openOnMount />}
          </div>
        </div>
        {chartReadings ? (
          <MonthChart readings={chartReadings} to={chartRange.to} />
        ) : (
          <div className="skeleton" aria-label="Loading chart" />
        )}
      </section>
    </>
  );
}
