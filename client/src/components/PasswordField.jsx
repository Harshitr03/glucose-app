import { useId, useState } from 'react';

export default function PasswordField({ value, onChange, autoComplete, hint }) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <div className="field">
      <label htmlFor={id}>Password</label>
      <div className="password-row">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          aria-describedby={hint ? `${id}-hint` : undefined}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((isVisible) => !isVisible)}
          aria-pressed={visible}
          aria-controls={id}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      {hint && (
        <span className="hint" id={`${id}-hint`}>
          {hint}
        </span>
      )}
    </div>
  );
}
