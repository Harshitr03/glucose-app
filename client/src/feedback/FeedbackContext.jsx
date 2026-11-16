import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const FeedbackContext = createContext(null);
const TOAST_MS = 6000;

function ConfirmDialog({ request, onAnswer }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal?.();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      aria-labelledby="confirm-title"
      onCancel={(event) => {
        event.preventDefault();
        onAnswer(false);
      }}
    >
      <h2 id="confirm-title">{request.title}</h2>
      {request.body && <p>{request.body}</p>}
      <div className="form-actions">
        <button type="button" className={request.danger ? 'danger' : undefined} onClick={() => onAnswer(true)}>
          {request.confirmLabel}
        </button>
        <button type="button" className="secondary" onClick={() => onAnswer(false)} autoFocus>
          Cancel
        </button>
      </div>
    </dialog>
  );
}

export function FeedbackProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [confirmRequest, setConfirmRequest] = useState(null);
  const timerRef = useRef(null);

  const dismissToast = useCallback(() => {
    clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  const showToast = useCallback((message, action) => {
    clearTimeout(timerRef.current);
    setToast({ message, action, id: Date.now() });
    timerRef.current = setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  const confirm = useCallback(
    ({ title, body, confirmLabel = 'Confirm', danger = false }) =>
      new Promise((resolve) => setConfirmRequest({ title, body, confirmLabel, danger, resolve })),
    [],
  );

  function answer(result) {
    confirmRequest.resolve(result);
    setConfirmRequest(null);
  }

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const value = useMemo(() => ({ showToast, confirm }), [showToast, confirm]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <div className="toast" key={toast.id}>
            <span>{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                className="toast-action"
                onClick={() => {
                  dismissToast();
                  toast.action.onClick();
                }}
              >
                {toast.action.label}
              </button>
            )}
            <button type="button" className="toast-close" onClick={dismissToast} aria-label="Dismiss">
              ×
            </button>
          </div>
        )}
      </div>
      {confirmRequest && <ConfirmDialog request={confirmRequest} onAnswer={answer} />}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  return useContext(FeedbackContext);
}
