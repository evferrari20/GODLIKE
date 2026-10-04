import { useState } from 'react';
import { useSettings } from '../store';
import { hasAI } from '../lib/ai';
import { suggestOptions, suggestQuestions } from '../lib/assist';
import { useBusy } from './ui';

export const ASSIST_LABELS = ['Just ask me questions', 'Suggest options', 'Draft it for me'];

/**
 * Inline "help me" for any field. It respects the writer's assist level:
 * 0 asks guiding questions, 1+ offers clickable options. `offline` supplies
 * built-in examples or questions when no API key is set.
 */
export default function HelpMe({ project, task, onPick, offline = [], label = 'Help me with this' }) {
  const level = useSettings((s) => s.assistLevel);
  const [busy, run] = useBusy();
  const [result, setResult] = useState(null);
  const ai = hasAI();

  const go = () =>
    run(async () => {
      if (!ai) return setResult({ kind: 'offline' });
      if (level === 0) setResult({ kind: 'questions', items: await suggestQuestions(project, task) });
      else setResult({ kind: 'options', items: await suggestOptions(project, task, level === 2 ? 4 : 3) });
    });

  return (
    <div className="col" style={{ gap: 8 }}>
      <div className="row">
        <button className="btn sm" onClick={go} disabled={busy}>
          {busy ? <span className="spinner" /> : '✨'} {label}
        </button>
        {result && <button className="btn sm ghost" onClick={() => setResult(null)}>Hide</button>}
        {!ai && <span className="faint small">Built-in help. Add a Claude key in Settings for personalized ideas.</span>}
      </div>
      {result?.kind === 'questions' && (
        <div className="card inset" style={{ padding: 12 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Questions to think about</div>
          <ul style={{ margin: 0, paddingLeft: 18 }} className="muted">
            {result.items.map((q, i) => <li key={i} style={{ marginBottom: 4 }}>{q}</li>)}
          </ul>
        </div>
      )}
      {result?.kind === 'options' && (
        <div className="col" style={{ gap: 8 }}>
          {result.items.map((o, i) => (
            <div key={i} className="option-card" onClick={() => onPick?.(o.text)}>
              <div className="oc-k">{o.title}</div>
              <div>{o.text}</div>
              {o.why && <div className="why" style={{ marginTop: 4 }}>{o.why}</div>}
            </div>
          ))}
          <div className="faint small">Click an option to use it, then make it your own.</div>
        </div>
      )}
      {result?.kind === 'offline' && (
        <div className="col" style={{ gap: 8 }}>
          {offline.length === 0 && <div className="faint small">Try answering in one honest sentence. You can always revise later.</div>}
          {offline.map((o, i) => (
            <div key={i} className="option-card" onClick={() => typeof o !== 'string' && onPick?.(o.text)} style={{ cursor: typeof o === 'string' ? 'default' : 'pointer' }}>
              {typeof o === 'string' ? o : (<><div className="oc-k">{o.title}</div><div>{o.text}</div></>)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
