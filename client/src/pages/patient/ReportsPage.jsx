import { useEffect, useState } from 'react';
import { api } from '../../api';
import ReportSection from '../../components/ReportSection';
import { formatDate } from '../../constants';

export default function ReportsPage() {
  const [notes, setNotes] = useState(null);

  useEffect(() => {
    api('/notes').then((data) => setNotes(data.notes)).catch(() => setNotes([]));
  }, []);

  return (
    <>
      <header className="page-header">
        <h1>Reports</h1>
      </header>
      <ReportSection reportsPath="/reports?" readingsPath="/readings?" />
      <section className="panel" aria-labelledby="notes-heading">
        <h2 id="notes-heading">Notes from your doctors</h2>
        {notes === null ? null : notes.length === 0 ? (
          <p className="empty">No notes yet. When a doctor writes a note for you, it appears here.</p>
        ) : (
          <ul className="notes">
            {notes.map((note) => (
              <li key={note.id}>
                <p>{note.body}</p>
                <small>
                  {note.doctorName}, {formatDate(note.updatedAt.slice(0, 10))}
                </small>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
