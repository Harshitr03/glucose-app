import { SLOTS, TARGET_RANGE, formatDate, rangeStatus } from '../constants';
import RangeFlag from './RangeFlag';
import SlotMarker from './SlotMarker';

function rangeLabel({ from, to }) {
  return from === to ? formatDate(from) : `${formatDate(from)} – ${formatDate(to)}`;
}

function Reading({ value }) {
  return (
    <>
      {value}
      <RangeFlag status={rangeStatus(value)} />
      <small>mg/dl</small>
    </>
  );
}

function ReportCard({ title, summary, primary = false, emptyText, children }) {
  const inRangePercent = summary.count ? Math.round((summary.inRange / summary.count) * 100) : 0;

  return (
    <section className={`report-card${primary ? ' is-primary' : ''}`}>
      <header>
        <h2>{title}</h2>
        <p>{rangeLabel(summary)}</p>
      </header>
      {summary.count === 0 ? (
        <p className="empty">{emptyText}</p>
      ) : (
        <dl className="stats">
          <div>
            <dt>Highest</dt>
            <dd>
              <Reading value={summary.highest} />
            </dd>
          </div>
          <div>
            <dt>Lowest</dt>
            <dd>
              <Reading value={summary.lowest} />
            </dd>
          </div>
          <div>
            <dt>Average</dt>
            <dd>
              {summary.average.toFixed(1)}
              <small>mg/dl</small>
            </dd>
          </div>
          <div>
            <dt>Readings</dt>
            <dd>
              {summary.count}
              <small>
                {summary.inRange} in range ({inRangePercent}%)
              </small>
            </dd>
          </div>
        </dl>
      )}
      {children}
    </section>
  );
}

function slotFor(key) {
  return SLOTS.find((slot) => slot.key === key);
}

export default function ReportView({ report }) {
  const { daily } = report;
  return (
    <div className="report-layout">
      <ReportCard title="Daily" summary={daily} primary emptyText="No readings on this day.">
        {daily.readings.length > 0 && (
          <ul className="day-readings" aria-label="Readings on this day">
            {daily.readings.map((reading) => {
              const slot = slotFor(reading.slot);
              return (
                <li key={reading.id} style={{ '--slot': slot.color }}>
                  <span>
                    <SlotMarker shape={slot.shape} color={slot.line} />
                    {reading.slotLabel}
                  </span>
                  <strong>
                    {reading.value} mg/dl
                    <RangeFlag status={rangeStatus(reading.value)} />
                  </strong>
                </li>
              );
            })}
          </ul>
        )}
        <p className="subtle">
          In range means {TARGET_RANGE.low}–{TARGET_RANGE.high} mg/dl.
        </p>
      </ReportCard>
      <div className="report-side">
        <ReportCard title="Month to date" summary={report.monthToDate} emptyText="No readings so far this month." />
        <ReportCard title="Previous month" summary={report.monthly} emptyText="No readings last month." />
      </div>
    </div>
  );
}
