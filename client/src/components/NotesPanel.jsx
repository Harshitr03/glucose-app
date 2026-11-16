import { useCallback, useEffect, useId, useState } from 'react';
import { api } from '../api';
import { formatTimestamp } from '../constants';
import FormError from './FormError';
import { useFeedback } from '../feedback/FeedbackContext';

function NoteEditor({ initial = '', submitLabel, onSave, onCancel }) {
  const id = useId();
  const [text, setText] = useState(initial);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSave(text);
      setText('');
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="note-editor" onSubmit={handleSubmit} noValidate>
      <label htmlFor={id} className="visually-hidden">
        Note
      </label>
      <textarea
        id={id}
        rows={3}
        value={text}
        placeholder="Write advice or observations for the patient"
        onChange={(event) => setText(event.target.value)}
        aria-invalid={error ? 'true' : undefined}
      />
      <FormError error={error} />
      <div className="form-actions">
        <button type="submit" className={onCancel ? 'small' : undefined} disabled={saving}>
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="secondary small" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function noteDate(note) {
  const edited = note.updatedAt !== note.createdAt;
  return `${edited ? 'Edited' : 'Added'} ${formatTimestamp(note.updatedAt)}`;
}

export default function NotesPanel({ patientId }) {
  const { showToast } = useFeedback();
  const [notes, setNotes] = useState(null);
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

  async function restoreNote(body) {
    try {
      await api('/notes', { method: 'POST', body: { patientId, body } });
      showToast('Note restored.');
      load();
    } catch (err) {
      showToast(err.message);
    }
  }

  async function deleteNote(note) {
    try {
      await api(`/note?id=${note.id}`, { method: 'DELETE' });
      load();
      showToast('Note deleted.', { label: 'Undo', onClick: () => restoreNote(note.body) });
    } catch (err) {
      setError(err);
    }
  }

  return (
    <section className="panel" aria-labelledby="notes-heading">
      <h2 id="notes-heading">Your notes for this patient</h2>
      <NoteEditor submitLabel="Add note" onSave={addNote} />
      <FormError error={error} />
      {notes === null ? (
        <p className="loading">Loading notes…</p>
      ) : notes.length === 0 ? (
        <p className="empty">No notes yet. The patient can read every note you add here.</p>
      ) : (
        <ul className="notes">
          {notes.map((note) => (
            <li key={note.id} className="note">
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
                  <div className="note-footer">
                    <small>{noteDate(note)}</small>
                    <div className="row-actions">
                      <button type="button" className="secondary small" onClick={() => setEditingId(note.id)}>
                        Edit
                      </button>
                      <button type="button" className="danger small" onClick={() => deleteNote(note)}>
                        Delete
                      </button>
                    </div>
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
