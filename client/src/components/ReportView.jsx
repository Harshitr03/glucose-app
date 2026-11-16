import { formatDate } from '../constants';

function rangeLabel({ from, to }) {
  return from === to ? formatDate(from) : `${formatDate(from)} – ${formatDate(to)}`;
}

function Stats({ title, summary, children }) {
  return (
    <section className="report-card">
      <h3>{title}</h3>
      <p className="report-range">{rangeLabel(summary)}</p>
      {summary.count === 0 ? (
        <p className="empty">No readings in this period.</p>
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

export default function ReportView({ report }) {
  return (
    <div className="report-grid">
      <Stats title="Daily" summary={report.daily}>
        {report.daily.readings.length > 0 && (
          <ul className="day-readings">
            {report.daily.readings.map((reading) => (
              <li key={reading.id}>
                <span>{reading.slotLabel}</span>
                <strong>{reading.value} mg/dl</strong>
              </li>
            ))}
          </ul>
        )}
      </Stats>
      <Stats title="Month to date" summary={report.monthToDate} />
      <Stats title="Previous month" summary={report.monthly} />
    </div>
  );
}
