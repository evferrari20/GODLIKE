import { useState } from 'react';
import { useSettings, toast } from '../store';
import { MODELS, ask } from '../lib/ai';
import { Field, Lesson, useBusy } from '../components/ui';
import { ASSIST_LABELS } from '../components/HelpMe';

export default function Settings() {
  const s = useSettings();
  const [show, setShow] = useState(false);
  const [busy, run] = useBusy();
  const test = () => run(async () => {
    const r = await ask({ content: 'Reply with exactly: Ready to write.', maxTokens: 200, effort: 'low' });
    toast(`Claude says: ${r.trim()}`, 'ok');
  });
  return (
    <div className="view pad">
      <div className="col" style={{ maxWidth: 720, gap: 22 }}>
        <h1>Settings</h1>

        <div className="card col">
          <h3>Claude AI</h3>
          <Lesson>
            GODLIKE works fully without AI: lessons, built-in ideas, formatting, the Beat Board and the Script Doctor quick checks are all free.
            Adding your own Claude API key unlocks personalized suggestions, scene drafts, character interviews, design briefs and full script coverage.
            Get a key at <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer">console.anthropic.com</a>.
            Your key is stored <b>only in this browser</b> and is sent only to Anthropic.
          </Lesson>
          <Field label="Claude API key">
            <div className="row">
              <input className="input" type={show ? 'text' : 'password'} value={s.apiKey} onChange={(e) => s.set({ apiKey: e.target.value.trim() })} placeholder="sk-ant-…" autoComplete="off" />
              <button className="btn sm" onClick={() => setShow((v) => !v)}>{show ? 'Hide' : 'Show'}</button>
            </div>
          </Field>
          <Field label="Model" help="Opus gives the best story notes. Sonnet and Haiku are faster and cheaper.">
            <select className="select" value={s.model} onChange={(e) => s.set({ model: e.target.value })}>
              {MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </Field>
          <div><button className="btn" disabled={!s.apiKey || busy} onClick={test}>{busy ? <span className="spinner" /> : '🔌'} Test connection</button></div>
        </div>

        <div className="card col">
          <h3>Writing help</h3>
          <Field label={`Assist level: ${ASSIST_LABELS[s.assistLevel]}`} help="How much the assistant does for you. Many writers start at Options and move to Questions as they gain confidence.">
            <input type="range" min={0} max={2} value={s.assistLevel} onChange={(e) => s.set({ assistLevel: Number(e.target.value) })} />
            <div className="slider-labels"><span>Just ask me questions</span><span>Suggest options</span><span>Draft it for me</span></div>
          </Field>
          <label className="row"><input type="checkbox" checked={s.tips} onChange={(e) => s.set({ tips: e.target.checked })} /> Show teaching tips as I work</label>
        </div>

        <div className="card col">
          <h3>Concept art images</h3>
          <Field label="Image generator" help="Pollinations is free and needs no account. OpenAI gives higher quality but needs its own paid key.">
            <select className="select" value={s.imageProvider} onChange={(e) => s.set({ imageProvider: e.target.value })}>
              <option value="pollinations">Pollinations.ai (free, no key)</option>
              <option value="openai">OpenAI images (your key)</option>
              <option value="none">Off</option>
            </select>
          </Field>
          {s.imageProvider === 'openai' && (
            <Field label="OpenAI API key"><input className="input" type="password" value={s.openaiKey} onChange={(e) => s.set({ openaiKey: e.target.value.trim() })} placeholder="sk-…" /></Field>
          )}
        </div>

        <div className="card col">
          <h3>Appearance</h3>
          <div className="row">
            <button className={`chip ${s.theme === 'dark' ? 'on' : ''}`} onClick={() => s.set({ theme: 'dark' })}>Mahogany dark</button>
            <button className={`chip ${s.theme === 'light' ? 'on' : ''}`} onClick={() => s.set({ theme: 'light' })}>Parchment light</button>
          </div>
        </div>

        <div className="faint small">Projects are saved automatically in this browser (IndexedDB). Use Export → Project backup to keep copies or move to another device.</div>
      </div>
    </div>
  );
}
