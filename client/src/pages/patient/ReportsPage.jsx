import { useEffect, useState } from 'react';
import { api } from '../../api';
import ReportSection from '../../components/ReportSection';
import { formatTimestamp } from '../../constants';
import useDocumentTitle from '../../useDocumentTitle';

export default function ReportsPage() {
  useDocumentTitle('Reports');
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
        {notes === null ? (
          <p className="loading">Loading notes…</p>
        ) : notes.length === 0 ? (
          <p className="empty">No notes yet. When a doctor writes a note for you, it appears here.</p>
        ) : (
          <ul className="notes">
            {notes.map((note) => (
              <li key={note.id} className="note">
                <p>{note.body}</p>
                <div className="note-footer">
                  <small>
                    {note.doctorName}, {formatTimestamp(note.updatedAt)}
                  </small>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
