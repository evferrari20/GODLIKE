import { useState } from 'react';
import { useToast, useSettings, toast } from '../store';
import { hasAI } from '../lib/ai';

export function Toasts() {
  const toasts = useToast((s) => s.toasts);
  return (
    <div className="toasts">
      {toasts.map((t) => <div key={t.id} className={`toast ${t.kind || ''}`}>{t.msg}</div>)}
    </div>
  );
}

export function Modal({ onClose, children, wide }) {
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal ${wide ? 'wide' : ''}`}>{children}</div>
    </div>
  );
}

export function Field({ label, help, children }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      {children}
      {help && <div className="help">{help}</div>}
    </div>
  );
}

/** Contextual teaching note; hidden when the writer turns tips off. */
export function Tip({ children, force }) {
  const tips = useSettings((s) => s.tips);
  if (!tips && !force) return null;
  return <div className="tip"><span className="ico">💡</span><div>{children}</div></div>;
}

export function Lesson({ children }) {
  return <div className="lesson">{children}</div>;
}

/** Runs an async action with a spinner and error toast. */
export function useBusy() {
  const [busy, setBusy] = useState(false);
  const run = async (fn) => {
    setBusy(true);
    try {
      return await fn();
    } catch (e) {
      toast(e.message || String(e), 'error');
    } finally {
      setBusy(false);
    }
  };
  return [busy, run];
}

/** A button for an AI action. Without a key it explains how to turn AI on. */
export function AIButton({ onClick, busy, children, className = '', ...rest }) {
  const enabled = hasAI();
  return (
    <button
      className={`btn ${className}`}
      disabled={busy || rest.disabled}
      onClick={() => (enabled ? onClick() : toast('AI features need your Claude API key. Add it in Settings (it stays in your browser).'))}
      title={enabled ? undefined : 'Add a Claude API key in Settings to enable'}
    >
      {busy ? <span className="spinner" /> : <span>✨</span>}
      {children}
    </button>
  );
}

export function Chips({ options, value, onChange, multi = true }) {
  const set = new Set(value || []);
  return (
    <div className="row wrap">
      {options.map((o) => (
        <button
          key={o}
          className={`chip ${set.has(o) ? 'on' : ''}`}
          onClick={() => {
            if (!multi) return onChange([o]);
            const n = new Set(set);
            n.has(o) ? n.delete(o) : n.add(o);
            onChange([...n]);
          }}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function initials(name) {
  return (name || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}
