import { useMemo, useState } from 'react';
import { useSettings, uid, toast } from '../store';
import { SCENE_BANK, ELEMENT_TIPS } from '../data/tips';
import { ELEMENTS, FORMATS, tabCycle } from '../data/formats';
import { hasAI, ask, projectContext, scriptToText } from '../lib/ai';
import { suggestOptions, suggestQuestions, draftBlocks } from '../lib/assist';
import { useBusy } from './ui';
import { ASSIST_LABELS } from './HelpMe';

const shuffle = (a) => [...a].sort(() => Math.random() - 0.5);

/**
 * The right-hand panel of the script editor. Its behaviour follows the
 * writer's assist level: questions (0), options (1) or drafts (2).
 */
export default function SceneAssistant({ project, scene, focusBlock, insertAfter, setBlock }) {
  const [tab, setTab] = useState('assist');
  return (
    <>
      <div className="assist-head">
        <div className="tabs" style={{ margin: 0, borderBottom: 'none' }}>
          {[['assist', '✨ Assist'], ['chat', '💬 Mentor'], ['guide', '📘 Guide']].map(([k, l]) => (
            <button key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
      </div>
      {tab === 'assist' && <AssistTab project={project} scene={scene} focusBlock={focusBlock} insertAfter={insertAfter} setBlock={setBlock} />}
      {tab === 'chat' && <ChatTab project={project} scene={scene} />}
      {tab === 'guide' && <GuideTab project={project} focusBlock={focusBlock} />}
    </>
  );
}

function AssistLevel() {
  const { assistLevel, set } = useSettings();
  return (
    <div>
      <div className="row"><b className="small">How much help?</b><div className="spacer" /><span className="tag blue">{ASSIST_LABELS[assistLevel]}</span></div>
      <input type="range" min={0} max={2} step={1} value={assistLevel} onChange={(e) => set({ assistLevel: Number(e.target.value) })} />
      <div className="slider-labels"><span>Questions</span><span>Options</span><span>Drafts</span></div>
    </div>
  );
}

function AssistTab({ project, scene, focusBlock, insertAfter, setBlock }) {
  const level = useSettings((s) => s.assistLevel);
  const [busy, run] = useBusy();
  const [aiResult, setAiResult] = useState(null);
  const [request, setRequest] = useState('');
  const [seed, setSeed] = useState(0);
  const ai = hasAI();
  const fmt = FORMATS[project.format];
  const heading = scene?.blocks?.[0];
  const sceneText = scene ? scriptToText(scene.blocks) : '';
  const genre = project.genres?.[0];
  const lastId = scene?.blocks?.at(-1)?.id || focusBlock?.id;

  const bank = useMemo(() => ({
    places: shuffle([...(SCENE_BANK.places[genre] || []), ...SCENE_BANK.places.any]).slice(0, 5),
    conflicts: shuffle(SCENE_BANK.conflicts).slice(0, 3),
    openings: shuffle(SCENE_BANK.openings).slice(0, 3),
    endings: shuffle(SCENE_BANK.endings).slice(0, 3),
    questions: shuffle(SCENE_BANK.questions).slice(0, 4),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [genre, seed, scene?.id]);

  const note = heading?.note || '';
  const setNote = (v) => heading && setBlock(heading.id, { note: v });
  const addNote = (line) => { setNote(note ? `${note}\n• ${line}` : `• ${line}`); toast('Added to scene notes', 'ok'); };

  const pickPlace = (place) => {
    const loc = place.replace(/^an? /i, '').toUpperCase();
    const isExt = /rooftop|parking|platform|bus shelter|forest|camp|market|docks|street|beach/i.test(place);
    const text = `${isExt ? 'EXT.' : 'INT.'} ${loc} - ${fmt.id === 'audioDrama' ? 'NIGHT' : 'DAY'}`;
    if (heading && heading.type === 'scene' && !heading.text.trim()) setBlock(heading.id, { text });
    else insertAfter(lastId, [{ id: uid(), type: 'scene', text }, { id: uid(), type: 'action', text: '' }]);
  };
  const pickTime = (t) => {
    if (!heading || heading.type !== 'scene') return;
    const base = heading.text.split(' - ')[0].trim() || 'INT. LOCATION';
    setBlock(heading.id, { text: `${base} - ${t}` });
  };

  const aiQuestions = () => run(async () => setAiResult({ kind: 'q', items: await suggestQuestions(project, `this scene:\n${sceneText}\nScene notes: ${note}`) }));
  const aiOptions = (what) => run(async () => setAiResult({ kind: 'o', what, items: await suggestOptions(project, `${what}\n\nCURRENT SCENE:\n${sceneText || '(empty)'}\nSCENE NOTES: ${note || '(none)'}`) }));
  const aiDraft = () => run(async () => {
    const res = await draftBlocks(project, { sceneText, request: request || 'Continue this scene naturally from where it stops, for about half a page.' });
    setAiResult({ kind: 'd', ...res });
  });
  const insertDraft = () => {
    const blocks = aiResult.blocks.filter((b) => fmt.elements.includes(b.type)).map((b) => ({ id: uid(), type: b.type, text: b.text }));
    if (!blocks.length) return;
    insertAfter(focusBlock?.id || lastId, blocks);
    setAiResult(null);
    toast('Draft inserted. Now rewrite it in your voice!', 'ok');
  };

  return (
    <div className="assist-body">
      <AssistLevel />

      <div className="card inset" style={{ padding: 12 }}>
        <div className="eyebrow">This scene</div>
        <div style={{ fontFamily: 'var(--font-script)', fontWeight: 700, margin: '4px 0 8px' }}>{heading?.text || 'No scene heading yet'}</div>
        <textarea className="textarea" rows={3} placeholder="Scene notes: who wants what, what's in the way, how does it turn?" value={note} onChange={(e) => setNote(e.target.value)} disabled={!heading} />
        <div className="why" style={{ marginTop: 6 }}>Notes are for you only and never appear in the script.</div>
      </div>

      {level === 0 && (
        <Section title="Think it through">
          <ul style={{ margin: 0, paddingLeft: 18 }} className="muted small">
            {bank.questions.map((q) => <li key={q} style={{ marginBottom: 5 }}>{q}</li>)}
          </ul>
          <div className="row">
            <button className="btn xs ghost" onClick={() => setSeed((s) => s + 1)}>🎲 Different questions</button>
            {ai && <button className="btn xs" onClick={aiQuestions} disabled={busy}>{busy ? <span className="spinner" /> : '✨'} Questions about my scene</button>}
          </div>
        </Section>
      )}

      {level >= 1 && (
        <>
          <Section title="Where could it happen?" why="A surprising location can turn an ordinary conversation into a memorable scene.">
            <div className="row wrap">{bank.places.map((p) => <button key={p} className="chip" onClick={() => pickPlace(p)}>{p}</button>)}</div>
          </Section>
          {heading?.type === 'scene' && (
            <Section title="When?">
              <div className="row wrap">{SCENE_BANK.times.map((t) => <button key={t} className="chip" onClick={() => pickTime(t)}>{t}</button>)}</div>
            </Section>
          )}
          <Section title="What's the conflict?" why="Every scene needs someone who wants something and something in their way.">
            {bank.conflicts.map((c) => <div key={c} className="option-card small" onClick={() => addNote(c)}>{c}</div>)}
          </Section>
          <div className="grid c2" style={{ gap: 10 }}>
            <Section title="Open by…">{bank.openings.map((c) => <div key={c} className="option-card small" onClick={() => addNote(c)}>{c}</div>)}</Section>
            <Section title="End by…">{bank.endings.map((c) => <div key={c} className="option-card small" onClick={() => addNote(c)}>{c}</div>)}</Section>
          </div>
          <div className="row wrap">
            <button className="btn xs ghost" onClick={() => setSeed((s) => s + 1)}>🎲 Shuffle ideas</button>
          </div>
          {ai && (
            <Section title="Tailored to your story">
              <div className="row wrap">
                <button className="btn xs" disabled={busy} onClick={() => aiOptions('Suggest ways this scene could unfold, given the story so far.')}>✨ How could this scene go?</button>
                <button className="btn xs" disabled={busy} onClick={() => aiOptions('Suggest what the NEXT scene could be, to keep momentum and pay off setups.')}>✨ What happens next?</button>
                <button className="btn xs" disabled={busy} onClick={() => aiOptions('Suggest ways to raise the tension or stakes in this scene.')}>✨ Raise the stakes</button>
                <button className="btn xs" disabled={busy} onClick={() => aiOptions('Suggest subtext-rich alternatives for the most on-the-nose line in this scene. Put the replacement line in text.')}>✨ Add subtext</button>
              </div>
            </Section>
          )}
        </>
      )}

      {level === 2 && (
        <Section title="Draft with me" why="Drafts are a starting point. Rewriting them in your own voice is how you learn.">
          <textarea className="textarea" rows={2} value={request} onChange={(e) => setRequest(e.target.value)} placeholder="e.g. Mara confronts Sam about the missing net. She doesn't say what she really means." />
          <button className="btn sm primary" disabled={busy || !ai} onClick={aiDraft}>{busy ? <span className="spinner" /> : '✨'} Draft it</button>
          {!ai && <div className="faint small">Drafting needs a Claude API key (Settings).</div>}
        </Section>
      )}

      {busy && <div className="row muted small"><span className="spinner" /> Thinking about your scene…</div>}

      {aiResult?.kind === 'q' && (
        <Section title="Questions for this scene">
          <ul style={{ margin: 0, paddingLeft: 18 }} className="muted small">{aiResult.items.map((q, i) => <li key={i} style={{ marginBottom: 5 }}>{q}</li>)}</ul>
        </Section>
      )}
      {aiResult?.kind === 'o' && (
        <Section title="Options">
          {aiResult.items.map((o, i) => (
            <div key={i} className="option-card" onClick={() => addNote(`${o.title}: ${o.text}`)}>
              <div className="oc-k">{o.title}</div><div className="small">{o.text}</div>
              <div className="why" style={{ marginTop: 4 }}>{o.why}</div>
            </div>
          ))}
          <div className="faint small">Click to save an option to your scene notes.</div>
        </Section>
      )}
      {aiResult?.kind === 'd' && (
        <Section title="Draft">
          <div className="why">{aiResult.note}</div>
          <div className="draft">{scriptToText(aiResult.blocks)}</div>
          <div className="row">
            <button className="btn sm primary" onClick={insertDraft}>Insert at cursor</button>
            <button className="btn sm" onClick={aiDraft} disabled={busy}>Try again</button>
            <button className="btn sm ghost" onClick={() => setAiResult(null)}>Discard</button>
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, why, children }) {
  return (
    <div className="col" style={{ gap: 7 }}>
      <div className="eyebrow">{title}</div>
      {why && <div className="why">{why}</div>}
      {children}
    </div>
  );
}

function ChatTab({ project, scene }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [busy, run] = useBusy();
  const ai = hasAI();
  const send = (text) => run(async () => {
    const q = (text ?? input).trim();
    if (!q) return;
    const history = msgs.map((m) => ({ role: m.role, content: m.text }));
    setMsgs((m) => [...m, { role: 'user', text: q }]);
    setInput('');
    const reply = await ask({
      system: `You are chatting in the side panel of the script editor. Keep replies short (under 200 words) unless asked for more. Use plain text, no markdown headings.\n\nPROJECT:\n${projectContext(project)}\n\nCURRENT SCENE:\n${scene ? scriptToText(scene.blocks) : '(none)'}`,
      content: q,
      history,
      maxTokens: 4000,
    });
    setMsgs((m) => [...m, { role: 'assistant', text: reply }]);
  });

  return (
    <div className="assist-body">
      {!ai && <div className="tip"><span className="ico">🔑</span><div>The mentor chat uses Claude. Add your API key in Settings. It's stored only in this browser.</div></div>}
      {msgs.length === 0 && (
        <div className="col" style={{ gap: 6 }}>
          <div className="muted small">Ask anything about your script or the craft. The mentor knows your story bible and the scene you're in.</div>
          {['Is this scene doing enough?', 'How do I make this dialogue less on-the-nose?', 'What should my protagonist be doing in Act Two?', 'Explain what a midpoint is, using my story.'].map((s) => (
            <button key={s} className="option-card small" style={{ textAlign: 'left' }} onClick={() => ai && send(s)} disabled={!ai}>{s}</button>
          ))}
        </div>
      )}
      {msgs.map((m, i) => <div key={i} className={`chat-msg ${m.role === 'user' ? 'user' : 'ai'}`}>{m.text}</div>)}
      {busy && <div className="row muted small"><span className="spinner" /> Thinking…</div>}
      <div style={{ marginTop: 'auto' }} className="col">
        <textarea className="textarea" rows={2} value={input} disabled={!ai} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Ask your writing mentor…" />
        {msgs.length > 0 && <button className="btn xs ghost" onClick={() => setMsgs([])}>Clear chat</button>}
      </div>
    </div>
  );
}

function GuideTab({ project, focusBlock }) {
  const el = ELEMENTS[focusBlock?.type] || ELEMENTS.action;
  const cycle = tabCycle(project.format);
  return (
    <div className="assist-body">
      <div className="eyebrow">You're writing: {el.label}</div>
      <div className="draft">{el.hint}</div>
      {(ELEMENT_TIPS[focusBlock?.type] || []).map((t) => <div key={t} className="tip"><span className="ico">💡</span><div>{t}</div></div>)}
      <div className="divider" />
      <div className="eyebrow">Shortcuts</div>
      <table className="small muted" style={{ borderSpacing: '0 6px' }}>
        <tbody>
          <tr><td><span className="kbd">Enter</span></td><td>New line, using the logical next element</td></tr>
          <tr><td><span className="kbd">Tab</span> / <span className="kbd">Shift+Tab</span></td><td>Cycle element type</td></tr>
          <tr><td><span className="kbd">i</span> then <span className="kbd">Tab</span></td><td>INT. (in a scene heading)</td></tr>
          <tr><td><span className="kbd">Shift+Enter</span></td><td>Line break within an element</td></tr>
          <tr><td><span className="kbd">Ctrl+Z</span></td><td>Undo (Ctrl+Shift+Z redo)</td></tr>
          {cycle.map((t, i) => <tr key={t}><td><span className="kbd">Ctrl+{i + 1}</span></td><td>{ELEMENTS[t].label}</td></tr>)}
        </tbody>
      </table>
      <div className="divider" />
      <div className="eyebrow">Smart typing</div>
      <ul className="small muted" style={{ paddingLeft: 18, margin: 0 }}>
        <li>Start an action line with "int." or "ext." and it becomes a scene heading.</li>
        <li>Type "CUT TO:" in caps and it becomes a transition.</li>
        <li>Character names and locations autocomplete. Use ↑ ↓ then Enter.</li>
      </ul>
    </div>
  );
}
