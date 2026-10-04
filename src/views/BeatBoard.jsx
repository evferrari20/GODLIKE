import { useState } from 'react';
import { useActiveProject, useProjects, uid, toast } from '../store';
import { STRUCTURES } from '../data/structures';
import { FORMATS } from '../data/formats';
import { Modal, Field, Lesson, Tip, useBusy } from '../components/ui';
import HelpMe from '../components/HelpMe';
import { hasAI, ask, projectContext } from '../lib/ai';

const COLORS = ['#c99a68', '#2f86c0', '#8a3a27', '#6fb38a', '#e0a84a', '#9b6fc0', '#d9634c', '#7a8a99'];

export default function BeatBoard({ go }) {
  const project = useActiveProject();
  const update = useProjects((s) => s.update);
  const structure = STRUCTURES[project.structure];
  const [editing, setEditing] = useState(null);
  const [drag, setDrag] = useState(null);
  const [over, setOver] = useState(null); // {act, index}
  const [busy, run] = useBusy();
  const [showLesson, setShowLesson] = useState(true);

  const cards = project.cards;
  const setCards = (next) => update({ cards: next });
  const covered = new Set(cards.map((c) => c.beatId).filter(Boolean));
  const holes = structure.beats.filter((b) => !covered.has(b.id));

  const saveCard = (card) => {
    const exists = cards.some((c) => c.id === card.id);
    setCards(exists ? cards.map((c) => (c.id === card.id ? card : c)) : [...cards, card]);
    if (card.beatId && card.text) update((p) => ({ beats: { ...p.beats, [card.beatId]: card.text } }));
    setEditing(null);
  };

  const drop = (act, index) => {
    if (!drag) return;
    const moving = cards.find((c) => c.id === drag);
    const rest = cards.filter((c) => c.id !== drag);
    const inAct = rest.filter((c) => c.act === act);
    const target = inAct[index];
    const at = target ? rest.indexOf(target) : (() => {
      const lastInAct = inAct.at(-1);
      return lastInAct ? rest.indexOf(lastInAct) + 1 : rest.length;
    })();
    rest.splice(at, 0, { ...moving, act });
    setCards(rest);
    setDrag(null);
    setOver(null);
  };

  const writeScene = (card) => {
    const fmt = FORMATS[project.format];
    const type = fmt.elements.includes('scene') ? 'scene' : 'sceneHeading';
    const heading = { id: uid(), type, text: '', note: `${card.title}${card.text ? ': ' + card.text : ''}` };
    update((p) => ({ script: [...p.script, heading, { id: uid(), type: fmt.elements.includes('action') ? 'action' : 'stageDirection', text: '' }] }));
    toast('New scene added. The card is in its scene notes.', 'ok');
    go('script');
  };

  const fillHoles = () => run(async () => {
    const res = await ask({
      system: 'For each missing beat, propose one specific, concrete event that fits the story so far. Return JSON.',
      content: `${projectContext(project)}\n\nSTRUCTURE: ${structure.name}\nMISSING BEATS:\n${holes.map((b) => `- id=${b.id} | ${b.name}: ${b.ask}`).join('\n')}`,
      schema: {
        type: 'object',
        properties: { beats: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' }, text: { type: 'string' } }, required: ['id', 'title', 'text'], additionalProperties: false } } },
        required: ['beats'], additionalProperties: false,
      },
      maxTokens: 8000,
    });
    const byId = Object.fromEntries(structure.beats.map((b) => [b.id, b]));
    const added = res.beats.filter((b) => byId[b.id]).map((b) => ({ id: uid(), act: byId[b.id].act, title: b.title || byId[b.id].name, text: b.text, beatId: b.id, color: '#2f86c0', suggested: true }));
    setCards([...cards, ...added]);
    toast(`${added.length} suggested cards added in blue. Edit or delete any you don't love.`, 'ok');
  });

  return (
    <div className="view" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="row wrap" style={{ padding: '14px 18px 0' }}>
        <h2 style={{ margin: 0 }}>Beat Board</h2>
        <select className="select" style={{ width: 'auto' }} value={project.structure} onChange={(e) => update({ structure: e.target.value })}>
          {Object.entries(STRUCTURES).map(([k, s]) => <option key={k} value={k}>{s.name}</option>)}
        </select>
        <span className="faint small">{cards.length} cards · {holes.length} holes</span>
        <div className="spacer" />
        {holes.length > 0 && hasAI() && <button className="btn sm" onClick={fillHoles} disabled={busy}>{busy ? <span className="spinner" /> : '✨'} Fill the holes</button>}
        <button className="btn sm primary" onClick={() => setEditing({ id: uid(), act: 0, title: '', text: '', color: COLORS[0] })}>+ Card</button>
      </div>
      {showLesson && (
        <div style={{ padding: '12px 18px 0' }}>
          <Lesson>
            <b>How to use the board:</b> each card is a scene or sequence. Drag cards to reorder them or move them between acts.
            Dashed cards are <b>holes</b>: story beats you haven't planned yet. Click one to fill it.
            When a card feels solid, open it and press <b>Write this scene</b>.{' '}
            <button className="btn xs ghost" onClick={() => setShowLesson(false)}>Got it</button>
          </Lesson>
        </div>
      )}
      <div className="board">
        {structure.acts.map((actName, act) => {
          const inAct = cards.filter((c) => c.act === act);
          const actHoles = holes.filter((b) => b.act === act);
          return (
            <div key={actName} className="lane">
              <div className="lane-head"><h3>{actName}</h3><div className="spacer" /><span className="faint small">{inAct.length}</span></div>
              <div
                className={`lane-body ${over?.act === act ? 'drop' : ''}`}
                onDragOver={(e) => { e.preventDefault(); if (over?.act !== act) setOver({ act, index: inAct.length }); }}
                onDrop={(e) => { e.preventDefault(); drop(act, over?.index ?? inAct.length); }}
              >
                {inAct.map((c, i) => (
                  <div key={c.id}>
                    {over?.act === act && over.index === i && drag !== c.id && <div className="drop-line" />}
                    <div
                      className={`index-card ${drag === c.id ? 'dragging' : ''}`}
                      style={{ '--card-color': c.color }}
                      draggable
                      onDragStart={() => setDrag(c.id)}
                      onDragEnd={() => { setDrag(null); setOver(null); }}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setOver({ act, index: e.clientY < r.top + r.height / 2 ? i : i + 1 }); }}
                      onClick={() => setEditing(c)}
                    >
                      {c.beatId && <div className="ic-beat">{structure.beats.find((b) => b.id === c.beatId)?.name}{c.suggested ? ' · suggested' : ''}</div>}
                      <div className="ic-title">{c.title || 'Untitled'}</div>
                      {c.text && <div className="ic-text">{c.text}</div>}
                    </div>
                  </div>
                ))}
                {actHoles.map((b) => (
                  <div key={b.id} className="index-card hole" onClick={() => setEditing({ id: uid(), act, title: b.name, text: project.beats[b.id] || '', beatId: b.id, color: COLORS[0] })}>
                    <div className="ic-beat" style={{ color: 'var(--wood)' }}>Hole · {b.name}</div>
                    <div className="small">{b.ask}</div>
                  </div>
                ))}
                {!inAct.length && !actHoles.length && <div className="faint small center" style={{ padding: 20 }}>Drop cards here</div>}
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <CardEditor
          card={editing} project={project} structure={structure}
          onSave={saveCard} onClose={() => setEditing(null)}
          onDelete={() => { setCards(cards.filter((c) => c.id !== editing.id)); setEditing(null); }}
          onWrite={(c) => { saveCard(c); writeScene(c); }}
        />
      )}
    </div>
  );
}

function CardEditor({ card, project, structure, onSave, onClose, onDelete, onWrite }) {
  const [c, setC] = useState({ ...card, suggested: false });
  const beat = structure.beats.find((b) => b.id === c.beatId);
  const set = (patch) => setC((x) => ({ ...x, ...patch }));
  return (
    <Modal onClose={onClose}>
      <h2>{c.title || 'New card'}</h2>
      {beat && <Lesson><b>{beat.name}:</b> {beat.why}</Lesson>}
      <div className="col" style={{ marginTop: 14 }}>
        <Field label="Card title" help="A short label, e.g. 'Mara finds the creature'."><input className="input" value={c.title} onChange={(e) => set({ title: e.target.value })} autoFocus /></Field>
        <Field label="What happens?" help={beat ? beat.ask : 'Who wants what, what gets in the way, and how does it end?'}>
          <textarea className="textarea" rows={4} value={c.text} onChange={(e) => set({ text: e.target.value })} />
        </Field>
        <HelpMe project={project} task={beat ? `Suggest what happens at the "${beat.name}" beat. ${beat.ask}` : `Suggest what could happen in a scene titled "${c.title}" in act ${structure.acts[c.act]}.`} onPick={(t) => set({ text: t })} />
        <div className="grid c2">
          <Field label="Act">
            <select className="select" value={c.act} onChange={(e) => set({ act: Number(e.target.value) })}>
              {structure.acts.map((a, i) => <option key={a} value={i}>{a}</option>)}
            </select>
          </Field>
          <Field label="Story beat">
            <select className="select" value={c.beatId || ''} onChange={(e) => set({ beatId: e.target.value || undefined })}>
              <option value="">(none)</option>
              {structure.beats.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Color" help="Use colors to track storylines: A story, B story, a character's arc.">
          <div className="row">{COLORS.map((col) => <div key={col} className={`swatch ${c.color === col ? 'on' : ''}`} style={{ background: col, width: 26 }} onClick={() => set({ color: col })} />)}</div>
        </Field>
        <Tip>A good card answers: who wants what, what's in the way, and what has changed by the end?</Tip>
      </div>
      <div className="row wrap" style={{ marginTop: 18 }}>
        <button className="btn danger" onClick={onDelete}>Delete</button>
        <div className="spacer" />
        <button className="btn" onClick={() => onWrite(c)}>¶ Write this scene</button>
        <button className="btn primary" onClick={() => onSave(c)}>Save card</button>
      </div>
    </Modal>
  );
}
