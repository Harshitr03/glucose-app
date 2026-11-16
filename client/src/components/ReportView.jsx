import { SLOTS, formatDate } from '../constants';

function rangeLabel({ from, to }) {
  return from === to ? formatDate(from) : `${formatDate(from)} – ${formatDate(to)}`;
}

function ReportCard({ title, summary, primary = false, emptyText, children }) {
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
            <dd>{summary.highest}</dd>
          </div>
          <div>
            <dt>Lowest</dt>
            <dd>{summary.lowest}</dd>
          </div>
          <div>
            <dt>Average</dt>
            <dd>{summary.average.toFixed(1)}</dd>
          </div>
          <div>
            <dt>Readings</dt>
            <dd>{summary.count}</dd>
          </div>
        </dl>
      )}
      {children}
    </section>
  );
}

function slotColor(key) {
  return SLOTS.find((slot) => slot.key === key)?.color;
}

export default function ReportView({ report }) {
  const { daily } = report;
  return (
    <div className="report-layout">
      <ReportCard title="Daily" summary={daily} primary emptyText="No readings on this day.">
        {daily.readings.length > 0 && (
          <ul className="day-readings" aria-label="Readings on this day">
            {daily.readings.map((reading) => (
              <li key={reading.id} style={{ '--slot': slotColor(reading.slot) }}>
                <span>{reading.slotLabel}</span>
                <strong>{reading.value} mg/dl</strong>
              </li>
            ))}
          </ul>
        )}
      </ReportCard>
      <div className="report-side">
        <ReportCard title="Month to date" summary={report.monthToDate} emptyText="No readings so far this month." />
        <ReportCard title="Previous month" summary={report.monthly} emptyText="No readings last month." />
      </div>
    </div>
  );
}
