import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { formatDate } from '../constants';
import FormError from './FormError';

function NoteEditor({ initial = '', submitLabel, onSave, onCancel }) {
  const [text, setText] = useState(initial);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    try {
      await onSave(text);
      setText('');
    } catch (err) {
      setError(err);
    }
  }

  return (
    <form className="note-editor" onSubmit={handleSubmit} noValidate>
      <textarea rows={3} value={text} onChange={(event) => setText(event.target.value)} aria-label="Note" />
      <div className="form-actions">
        <button type="submit">{submitLabel}</button>
        {onCancel && (
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
      <FormError error={error} />
    </form>
  );
}

export default function NotesPanel({ patientId }) {
  const [notes, setNotes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    api(`/notes?patientId=${patientId}`).then((data) => setNotes(data.notes)).catch(setError);
  }, [patientId]);

  useEffect(load, [load]);

  async function addNote(body) {
    await api('/notes', { method: 'POST', body: { patientId, body } });
    load();
  }

  async function updateNote(id, body) {
    await api(`/note?id=${id}`, { method: 'PUT', body: { body } });
    setEditingId(null);
    load();
  }

  async function deleteNote(id) {
    if (!window.confirm('Delete this note?')) return;
    try {
      await api(`/note?id=${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err);
    }
  }

  return (
    <section className="panel">
      <h2>Your notes</h2>
      <NoteEditor submitLabel="Add note" onSave={addNote} />
      <FormError error={error} />
      {notes.length === 0 ? (
        <p className="empty">No notes yet. The patient sees every note you add.</p>
      ) : (
        <ul className="notes">
          {notes.map((note) => (
            <li key={note.id}>
              {editingId === note.id ? (
                <NoteEditor
                  initial={note.body}
                  submitLabel="Save note"
                  onSave={(body) => updateNote(note.id, body)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <>
                  <p>{note.body}</p>
                  <small>{formatDate(note.updatedAt.slice(0, 10))}</small>
                  <div className="row-actions">
                    <button type="button" className="link-button" onClick={() => setEditingId(note.id)}>
                      Edit
                    </button>
                    <button type="button" className="link-button danger" onClick={() => deleteNote(note.id)}>
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
