import { useMemo, useState } from 'react';
import { useActiveProject, useProjects, uid, toast } from '../store';
import { Field, Lesson, Tip, Modal, useBusy, initials, AIButton, ConfirmButton } from '../components/ui';
import HelpMe from '../components/HelpMe';
import { ROLES, newCharacter } from './Wizard';
import { ask, hasAI, projectContext } from '../lib/ai';
import { newDesign } from './DesignStudio';

const CHAR_FIELDS = [
  { k: 'want', label: 'Want', q: 'What are they actively chasing? Something we could see them achieve.', why: 'The want drives the plot.' },
  { k: 'need', label: 'Need', q: 'What must they learn or change to be whole? They usually don\'t know.', why: 'The need drives the theme. Great endings often trade the want for the need.' },
  { k: 'wound', label: 'Wound / backstory', q: 'What happened before the story that still shapes them?', why: 'The wound explains the flaw without excusing it.' },
  { k: 'flaw', label: 'Flaw', q: 'What behaviour gets in their own way?', why: 'The flaw creates inner conflict and makes the climax cost something.' },
  { k: 'arc', label: 'Arc', q: 'Who are they at the start, and who are they at the end?', why: 'Positive, negative or flat: decide which, on purpose.' },
  { k: 'voice', label: 'Voice', q: 'How do they talk? Vocabulary, rhythm, what they avoid saying, a verbal habit.', why: 'Cover the names. Can you still tell who\'s speaking?' },
  { k: 'look', label: 'Look', q: 'One or two vivid physical details that reveal character, not a catalogue.', why: 'Introduce characters with a telling detail, not a police description.' },
  { k: 'wardrobe', label: 'Wardrobe & style', q: 'What do they wear, and what does it say about them? Does it change as they change?', why: 'Costume is character. Many films track an arc through wardrobe.' },
  { k: 'notes', label: 'Notes', q: 'Anything else: secrets, habits, favourite things, contradictions.', why: 'Contradictions make characters feel real.' },
];

const REL_KINDS = ['Family', 'Romance', 'Friend', 'Rival', 'Enemy', 'Mentor', 'Colleague', 'Ex', 'Secret'];

export default function Bible({ go }) {
  const project = useActiveProject();
  const update = useProjects((s) => s.update);
  const [tab, setTab] = useState('characters');
  const [sel, setSel] = useState(project.characters[0]?.id);

  return (
    <div className="view" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 20px 0' }}>
        <div className="tabs" style={{ marginBottom: 0 }}>
          {[['characters', 'Characters'], ['relationships', 'Relationship Map'], ['locations', 'Locations'], ['world', 'World & Theme']].map(([k, l]) => (
            <button key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        {tab === 'characters' && <Characters project={project} update={update} sel={sel} setSel={setSel} go={go} />}
        {tab === 'relationships' && <RelMap project={project} onPick={(id) => { setSel(id); setTab('characters'); }} />}
        {tab === 'locations' && <Locations project={project} update={update} go={go} />}
        {tab === 'world' && <World project={project} update={update} />}
      </div>
    </div>
  );
}

export function openDesignFor(project, update, go, { kind, linkedId, title }) {
  let d = project.designs.find((x) => x.linkedId === linkedId && x.kind === kind);
  if (!d) {
    d = newDesign({ kind, linkedId, title });
    update({ designs: [...project.designs, d], openDesignId: d.id });
  } else update({ openDesignId: d.id });
  go('design');
}

function Characters({ project, update, sel, setSel, go }) {
  const chars = project.characters;
  const c = chars.find((x) => x.id === sel) || chars[0];
  const setC = (patch) => update({ characters: chars.map((x) => (x.id === c.id ? { ...x, ...patch } : x)) });
  const [interview, setInterview] = useState(false);
  const [voice, setVoice] = useState(false);

  const add = () => { const n = newCharacter(); update({ characters: [...chars, n] }); setSel(n.id); };

  return (
    <div className="bible" style={{ height: '100%' }}>
      <div className="bible-list">
        <button className="btn sm primary" style={{ width: '100%', marginBottom: 10 }} onClick={add}>+ New character</button>
        {ROLES.map((role) => {
          const list = chars.filter((x) => x.role === role);
          if (!list.length) return null;
          return (
            <div key={role}>
              <div className="nav-label" style={{ padding: '10px 4px 4px' }}>{role}</div>
              {list.map((x) => (
                <div key={x.id} className={`bible-item ${c?.id === x.id ? 'active' : ''}`} onClick={() => setSel(x.id)}>
                  <div className="avatar">{x.portrait ? <img src={x.portrait} alt="" /> : initials(x.name)}</div>
                  <div className="grow"><div style={{ fontWeight: 600 }}>{x.name || 'Unnamed'}</div><div className="faint small" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.logline}</div></div>
                </div>
              ))}
            </div>
          );
        })}
        {!chars.length && <div className="faint small">No characters yet.</div>}
      </div>

      <div className="view pad">
        {!c ? (
          <div className="empty">
            <h2>Your cast lives here</h2>
            <p>Create a character to start building their profile, voice, relationships and look.</p>
            <button className="btn primary" onClick={add}>+ Create your first character</button>
          </div>
        ) : (
          <div style={{ maxWidth: 900 }}>
            <div className="row wrap" style={{ alignItems: 'flex-start', gap: 18 }}>
              <div className="avatar lg">{c.portrait ? <img src={c.portrait} alt="" /> : initials(c.name)}</div>
              <div className="grow col" style={{ gap: 8 }}>
                <input className="input" style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, padding: '4px 10px' }} value={c.name} onChange={(e) => setC({ name: e.target.value })} placeholder="Character name" />
                <div className="row wrap">
                  <select className="select" style={{ width: 160 }} value={c.role} onChange={(e) => setC({ role: e.target.value })}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
                  <input className="input" style={{ width: 100 }} value={c.age} onChange={(e) => setC({ age: e.target.value })} placeholder="Age" />
                  <input className="input grow" value={c.logline} onChange={(e) => setC({ logline: e.target.value })} placeholder="One line: who are they?" />
                </div>
                <div className="row wrap">
                  <button className="btn sm" onClick={() => openDesignFor(project, update, go, { kind: 'character', linkedId: c.id, title: `${c.name || 'Character'} — Look` })}>✎ Design their look</button>
                  <AIButton className="sm" onClick={() => setInterview(true)}>Interview {c.name || 'them'}</AIButton>
                  <button className="btn sm" onClick={() => setVoice(true)}>🔊 Voice check</button>
                  <div className="spacer" />
                  <ConfirmButton className="sm ghost danger" onConfirm={() => { update({ characters: chars.filter((x) => x.id !== c.id) }); setSel(chars.find((x) => x.id !== c.id)?.id); }} />
                </div>
              </div>
            </div>
            {c.role === 'Protagonist' && <div style={{ marginTop: 16 }}><Lesson><b>Protagonist tip:</b> your hero's flaw should be exactly what the climax tests. Write the want, need and flaw first. They're the engine of the whole story.</Lesson></div>}
            {c.role === 'Antagonist' && <div style={{ marginTop: 16 }}><Lesson><b>Antagonist tip:</b> the best antagonists believe they're right, and they often embody the opposite of your theme. Give them a want as strong as the hero's.</Lesson></div>}

            <div className="col" style={{ gap: 20, marginTop: 22 }}>
              {CHAR_FIELDS.map((f) => (
                <div key={f.k} className="card col" style={{ gap: 8 }}>
                  <div className="row"><h3 style={{ margin: 0 }}>{f.label}</h3><div className="spacer" /><span className="why">{f.why}</span></div>
                  <div className="muted small">{f.q}</div>
                  <textarea className="textarea" rows={2} value={c[f.k] || ''} onChange={(e) => setC({ [f.k]: e.target.value })} />
                  <HelpMe project={project} task={`For the character ${c.name || '(unnamed)'} (${c.role}), suggest their ${f.label.toLowerCase()}. Guidance: ${f.q}`} onPick={(t) => setC({ [f.k]: t })} label={`Ideas for ${f.label.toLowerCase()}`} />
                </div>
              ))}

              <div className="card col">
                <h3 style={{ margin: 0 }}>Relationships</h3>
                <div className="muted small">Who matters to {c.name || 'them'}? Every relationship is a source of conflict or support.</div>
                {(c.relationships || []).map((r, i) => (
                  <div key={i} className="row">
                    <select className="select" style={{ width: 180 }} value={r.to} onChange={(e) => setC({ relationships: c.relationships.map((x, j) => (j === i ? { ...x, to: e.target.value } : x)) })}>
                      <option value="">Choose…</option>
                      {project.characters.filter((x) => x.id !== c.id).map((x) => <option key={x.id} value={x.id}>{x.name || 'Unnamed'}</option>)}
                    </select>
                    <select className="select" style={{ width: 130 }} value={r.kind} onChange={(e) => setC({ relationships: c.relationships.map((x, j) => (j === i ? { ...x, kind: e.target.value } : x)) })}>
                      {REL_KINDS.map((k) => <option key={k}>{k}</option>)}
                    </select>
                    <input className="input grow" value={r.note || ''} placeholder="What's the tension between them?" onChange={(e) => setC({ relationships: c.relationships.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)) })} />
                    <button className="btn icon ghost" onClick={() => setC({ relationships: c.relationships.filter((_, j) => j !== i) })}>✕</button>
                  </div>
                ))}
                <div><button className="btn sm" onClick={() => setC({ relationships: [...(c.relationships || []), { to: '', kind: 'Friend', note: '' }] })}>+ Relationship</button></div>
              </div>
            </div>
          </div>
        )}
      </div>
      {interview && c && <Interview project={project} c={c} onClose={() => setInterview(false)} onSaveNote={(t) => setC({ notes: (c.notes ? c.notes + '\n' : '') + t })} />}
      {voice && c && <VoiceCheck project={project} c={c} onClose={() => setVoice(false)} />}
    </div>
  );
}

function Interview({ project, c, onClose, onSaveNote }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [busy, run] = useBusy();
  const starters = ['What do you want more than anything?', 'What are you most afraid of?', 'Tell me about the worst day of your life.', 'What do people get wrong about you?', 'What would you never do?', 'Who do you trust?'];
  const send = (text) => run(async () => {
    const q = (text ?? input).trim();
    if (!q) return;
    const history = msgs.map((m) => ({ role: m.role, content: m.text }));
    setMsgs((m) => [...m, { role: 'user', text: q }]);
    setInput('');
    const reply = await ask({
      system: `Role-play as the character ${c.name || 'the character'} being interviewed by their writer. Stay in character, in first person, in their voice. Be specific and surprising; invent concrete details consistent with the profile. Keep answers under 150 words. The point is to help the writer discover the character.\n\nSTORY:\n${projectContext(project)}\n\nTHIS CHARACTER'S PROFILE:\n${JSON.stringify({ ...c, portrait: undefined, relationships: undefined })}`,
      content: q, history, maxTokens: 2000, effort: 'low',
    });
    setMsgs((m) => [...m, { role: 'assistant', text: reply }]);
  });
  return (
    <Modal onClose={onClose} wide>
      <div className="row"><h2 style={{ margin: 0 }}>Interview: {c.name || 'Unnamed'}</h2><div className="spacer" /><button className="btn sm" onClick={onClose}>Close</button></div>
      <Lesson>Writers often "interview" their characters to discover their voice. Ask anything, then save the answers you like to their notes. Claude improvises from the profile, so the details are suggestions, not canon.</Lesson>
      <div className="col" style={{ margin: '14px 0', maxHeight: '45vh', overflow: 'auto' }}>
        {msgs.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role === 'user' ? 'user' : 'ai'}`}>
            {m.text}
            {m.role === 'assistant' && <div><button className="btn xs ghost" onClick={() => { onSaveNote(`Interview — ${m.text}`); toast('Saved to notes', 'ok'); }}>+ Save to notes</button></div>}
          </div>
        ))}
        {busy && <div className="row muted small"><span className="spinner" /> {c.name || 'They'} is thinking…</div>}
      </div>
      <div className="row wrap" style={{ marginBottom: 8 }}>{starters.map((s) => <button key={s} className="chip" onClick={() => send(s)} disabled={busy}>{s}</button>)}</div>
      <div className="row">
        <input className="input grow" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder={`Ask ${c.name || 'them'} a question…`} />
        <button className="btn primary" onClick={() => send()} disabled={busy}>Ask</button>
      </div>
    </Modal>
  );
}

function VoiceCheck({ project, c, onClose }) {
  const name = (c.name || '').toUpperCase();
  const lines = useMemo(() => {
    const out = [];
    const s = project.script;
    for (let i = 0; i < s.length; i++) {
      if (s[i].type === 'character' && s[i].text.toUpperCase().replace(/\s*\(.*$/, '').trim() === name) {
        let j = i + 1;
        while (j < s.length && ['dialogue', 'parenthetical'].includes(s[j].type)) {
          if (s[j].type === 'dialogue') out.push(s[j].text);
          j++;
        }
      }
    }
    return out;
  }, [project.script, name]);
  const [busy, run] = useBusy();
  const [analysis, setAnalysis] = useState('');
  const words = lines.join(' ').split(/\s+/).filter(Boolean);
  const avg = lines.length ? Math.round(words.length / lines.length) : 0;
  return (
    <Modal onClose={onClose} wide>
      <h2>Voice check: {c.name}</h2>
      <Lesson>Reading one character's lines together shows whether they have a distinct voice. Look for consistent vocabulary, rhythm and attitude, and for lines that sound like someone else.</Lesson>
      <div className="row" style={{ margin: '12px 0' }}>
        <span className="tag">{lines.length} lines</span><span className="tag">{avg} words / line avg</span>
        <div className="spacer" />
        {hasAI() && lines.length > 2 && <button className="btn sm" disabled={busy} onClick={() => run(async () => setAnalysis(await ask({ content: `Character profile: ${c.voice || '(no voice notes)'}; flaw: ${c.flaw}.\nAll their dialogue:\n${lines.map((l) => '- ' + l).join('\n')}\n\nAnalyze this character's voice in under 200 words: what's distinctive, which lines sound off or generic, and two concrete ways to sharpen it.`, maxTokens: 3000, effort: 'low' })))}>{busy ? <span className="spinner" /> : '✨'} Analyze voice</button>}
      </div>
      {analysis && <div className="card inset" style={{ whiteSpace: 'pre-wrap', marginBottom: 12 }}>{analysis}</div>}
      <div className="draft" style={{ maxHeight: '45vh', overflow: 'auto' }}>
        {lines.length ? lines.map((l, i) => <div key={i} style={{ marginBottom: 8 }}>{l}</div>) : `No dialogue yet for ${name || 'this character'}. Their name in the script must match exactly.`}
      </div>
    </Modal>
  );
}

function RelMap({ project, onPick }) {
  const chars = project.characters;
  const W = 760, H = 460, R = 170;
  const pos = Object.fromEntries(chars.map((c, i) => {
    const a = (i / Math.max(1, chars.length)) * Math.PI * 2 - Math.PI / 2;
    const lead = c.role === 'Protagonist' && chars.filter((x) => x.role === 'Protagonist').length === 1;
    return [c.id, lead ? [W / 2, H / 2] : [W / 2 + Math.cos(a) * R * 1.45, H / 2 + Math.sin(a) * R]];
  }));
  const colors = { Family: '#c99a68', Romance: '#d9634c', Friend: '#6fb38a', Rival: '#e0a84a', Enemy: '#d9634c', Mentor: '#2f86c0', Colleague: '#7a8a99', Ex: '#9b6fc0', Secret: '#9b6fc0' };
  const edges = chars.flatMap((c) => (c.relationships || []).filter((r) => pos[r.to]).map((r) => ({ from: c.id, ...r })));
  return (
    <div className="view pad">
      <Tip force>Relationships are where conflict lives. Add them on each character's page. Click a character to open it.</Tip>
      <svg className="rel-map" viewBox={`0 0 ${W} ${H}`} style={{ marginTop: 12 }}>
        {edges.map((e, i) => {
          const [x1, y1] = pos[e.from], [x2, y2] = pos[e.to];
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={colors[e.kind] || '#888'} strokeWidth="2.5" strokeDasharray={e.kind === 'Secret' ? '6 5' : undefined} opacity=".8" />
              <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 6} fill="var(--text-2)" fontSize="12" textAnchor="middle">{e.kind}</text>
            </g>
          );
        })}
        {chars.map((c) => {
          const [x, y] = pos[c.id];
          return (
            <g key={c.id} style={{ cursor: 'pointer' }} onClick={() => onPick(c.id)}>
              <circle cx={x} cy={y} r={c.role === 'Protagonist' ? 34 : 26} fill={c.role === 'Protagonist' ? 'var(--ocean)' : c.role === 'Antagonist' ? 'var(--mahogany)' : 'var(--panel-3)'} stroke="var(--wood)" strokeWidth="2" />
              <text x={x} y={y + 5} textAnchor="middle" fill="var(--text)" fontSize="15" fontFamily="var(--font-display)" fontWeight="700">{initials(c.name)}</text>
              <text x={x} y={y + (c.role === 'Protagonist' ? 52 : 44)} textAnchor="middle" fill="var(--text)" fontSize="12.5">{c.name || 'Unnamed'}</text>
            </g>
          );
        })}
        {!chars.length && <text x={W / 2} y={H / 2} textAnchor="middle" fill="var(--text-3)">Add characters to see the map</text>}
      </svg>
    </div>
  );
}

function Locations({ project, update, go }) {
  const locs = project.locations;
  const set = (id, patch) => update({ locations: locs.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
  const fromScript = useMemo(() => {
    const s = new Set();
    for (const b of project.script) if (b.type === 'scene') {
      const loc = b.text.toUpperCase().replace(/^(INT\.?\/EXT\.?|I\/E\.?|INT\.?|EXT\.?)\s*/, '').split(' - ')[0].trim();
      if (loc && !locs.some((l) => l.name.toUpperCase() === loc)) s.add(loc);
    }
    return [...s];
  }, [project.script, locs]);
  const add = (name = '') => update({ locations: [...locs, { id: uid(), name, desc: '', mood: '', notes: '' }] });
  return (
    <div className="view pad">
      <div style={{ maxWidth: 900 }}>
        <Lesson>Locations are characters too. A great setting adds pressure: a confession lands differently in a church than in a car wash. Limiting locations also keeps your script affordable to shoot.</Lesson>
        {fromScript.length > 0 && (
          <div className="tip" style={{ marginTop: 12 }}><span className="ico">📍</span><div>Found in your script: {fromScript.map((l) => <button key={l} className="chip" style={{ margin: 2 }} onClick={() => add(l)}>+ {l}</button>)}</div></div>
        )}
        <div className="col" style={{ marginTop: 16, gap: 14 }}>
          {locs.map((l) => (
            <div key={l.id} className="card col">
              <div className="row">
                <input className="input" style={{ fontWeight: 700, textTransform: 'uppercase', fontFamily: 'var(--font-script)' }} value={l.name} onChange={(e) => set(l.id, { name: e.target.value })} placeholder="LOCATION NAME" />
                <button className="btn sm" onClick={() => openDesignFor(project, update, go, { kind: 'setting', linkedId: l.id, title: `${l.name || 'Setting'} — Look` })}>✎ Design</button>
                <button className="btn icon ghost danger" onClick={() => update({ locations: locs.filter((x) => x.id !== l.id) })}>✕</button>
              </div>
              <Field label="What does it look, sound and smell like?"><textarea className="textarea" rows={2} value={l.desc} onChange={(e) => set(l.id, { desc: e.target.value })} /></Field>
              <Field label="Mood & meaning" help="What does this place mean to your characters?"><input className="input" value={l.mood} onChange={(e) => set(l.id, { mood: e.target.value })} /></Field>
              <HelpMe project={project} task={`Describe the location "${l.name}" vividly and concisely (sensory details, a telling detail, what it reveals about the people there).`} onPick={(t) => set(l.id, { desc: t })} label="Ideas for this place" />
            </div>
          ))}
          <div><button className="btn primary" onClick={() => add()}>+ Location</button></div>
        </div>
      </div>
    </div>
  );
}

function World({ project, update }) {
  return (
    <div className="view pad">
      <div className="col" style={{ maxWidth: 900, gap: 16 }}>
        <Lesson>Your story bible is the single source of truth. TV writers' rooms build a "series bible" for exactly this: premise, tone, rules of the world, and where the story could go.</Lesson>
        <Field label="Logline"><textarea className="textarea" rows={2} value={project.logline} onChange={(e) => update({ logline: e.target.value })} /></Field>
        <Field label="Theme"><input className="input" value={project.theme} onChange={(e) => update({ theme: e.target.value })} /></Field>
        <Field label="The idea"><textarea className="textarea" rows={3} value={project.idea} onChange={(e) => update({ idea: e.target.value })} /></Field>
        <Field label="World rules, tone & research notes" help="What's possible in this world? What's the time period? What's the tone? Any references or inspirations?">
          <textarea className="textarea" rows={10} value={project.worldNotes} onChange={(e) => update({ worldNotes: e.target.value })} />
        </Field>
        <HelpMe project={project} task="Suggest world-building details, rules, or tone notes that would deepen this story." onPick={(t) => update({ worldNotes: (project.worldNotes ? project.worldNotes + '\n\n' : '') + t })} label="Deepen the world" />
      </div>
    </div>
  );
}
