import { useEffect, useState } from 'react';
import { api } from '../../api';
import ReportSection from '../../components/ReportSection';
import { formatDate } from '../../constants';

export default function ReportsPage() {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    api('/notes').then((data) => setNotes(data.notes)).catch(() => setNotes([]));
  }, []);

  return (
    <>
      <h1>Reports</h1>
      <ReportSection reportsPath="/reports?" readingsPath="/readings?" />
      <section className="panel">
        <h2>Notes from your doctors</h2>
        {notes.length === 0 ? (
          <p className="empty">No notes yet. Notes your doctor writes will appear here.</p>
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
