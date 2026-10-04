import { useCallback, useRef, useState } from 'react';
import { useActiveProject, useProjects, useSettings, uid, toast } from '../store';
import DrawingCanvas from '../components/DrawingCanvas';
import { Lesson, Modal, useBusy, ConfirmButton } from '../components/ui';
import { ask, hasAI, imageBlock, projectContext } from '../lib/ai';
import { generateImage } from '../lib/imagegen';

export const KINDS = {
  character: { label: 'Character look', icon: '🧍', w: 1200, h: 1500, guide: 'pose' },
  wardrobe: { label: 'Wardrobe & costume', icon: '👗', w: 1200, h: 1500, guide: 'pose' },
  turnaround: { label: 'Character turnaround', icon: '🔄', w: 1800, h: 1100, guide: 'turnaround' },
  setting: { label: 'Setting / location', icon: '🏛', w: 1600, h: 1000, guide: 'persp1' },
  scene: { label: 'Scene / storyboard frame', icon: '🎬', w: 1600, h: 900, guide: 'frame' },
  prop: { label: 'Prop', icon: '🗝', w: 1200, h: 1200, guide: 'none' },
  moodboard: { label: 'Mood board', icon: '🎨', w: 1600, h: 1000, guide: 'none' },
};

const STYLES = ['pencil concept sketch', 'painted concept art', 'cinematic film still', 'costume design sheet', 'watercolor', 'ink illustration', 'animated feature style', 'noir, high contrast'];

export function newDesign({ kind = 'character', linkedId = '', title = '' } = {}) {
  const k = KINDS[kind] || KINDS.character;
  return {
    id: uid(), kind, linkedId, title: title || k.label, width: k.w, height: k.h, guide: k.guide,
    layers: [
      { id: uid(), name: 'Paper', visible: true, opacity: 1, paper: true },
      { id: uid(), name: 'Sketch', visible: true, opacity: 1 },
    ],
    brief: '', palette: [], imagePrompt: '', generated: [], svg: '', critique: '', notes: '', thumb: '', createdAt: Date.now(),
  };
}

export default function DesignStudio() {
  const project = useActiveProject();
  const update = useProjects((s) => s.update);
  const open = project.designs.find((d) => d.id === project.openDesignId);
  return open ? <Studio key={open.id} project={project} design={open} update={update} /> : <Gallery project={project} update={update} />;
}

function linkedName(project, d) {
  return project.characters.find((c) => c.id === d.linkedId)?.name || project.locations.find((l) => l.id === d.linkedId)?.name || '';
}

function Gallery({ project, update }) {
  const [creating, setCreating] = useState(false);
  const [kind, setKind] = useState('character');
  const [linked, setLinked] = useState('');
  const create = () => {
    const name = project.characters.find((c) => c.id === linked)?.name || project.locations.find((l) => l.id === linked)?.name;
    const d = newDesign({ kind, linkedId: linked, title: name ? `${name} — ${KINDS[kind].label}` : KINDS[kind].label });
    update({ designs: [...project.designs, d], openDesignId: d.id });
  };
  return (
    <div className="view pad">
      <div className="row wrap" style={{ marginBottom: 14 }}>
        <h2 style={{ margin: 0 }}>Design Studio</h2>
        <div className="spacer" />
        <button className="btn primary" onClick={() => setCreating(true)}>+ New design</button>
      </div>
      <Lesson>
        <b>See your story.</b> Sketch how your characters look and dress, what your locations feel like, and how key moments are framed.
        You don't need to be an artist: use the pose and perspective guides, drop in reference photos, ask Claude for a style brief, or generate free concept art and draw over it.
      </Lesson>
      <div className="design-grid" style={{ marginTop: 20 }}>
        {project.designs.map((d) => (
          <div key={d.id} className="card hover" style={{ padding: 10 }} onClick={() => update({ openDesignId: d.id })}>
            <div className="design-thumb">{d.thumb ? <img src={d.thumb} alt="" /> : <span style={{ fontSize: 40 }}>{KINDS[d.kind]?.icon}</span>}</div>
            <div className="row" style={{ marginTop: 8 }}>
              <div className="grow">
                <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.title}</div>
                <div className="faint small">{KINDS[d.kind]?.label}{linkedName(project, d) ? ` · ${linkedName(project, d)}` : ''}</div>
              </div>
              <ConfirmButton className="xs ghost danger" onConfirm={() => update({ designs: project.designs.filter((x) => x.id !== d.id) })}>✕</ConfirmButton>
            </div>
          </div>
        ))}
      </div>
      {!project.designs.length && <div className="empty">No designs yet. Start with your main character's look.</div>}

      {creating && (
        <Modal onClose={() => setCreating(false)}>
          <h2>New design</h2>
          <div className="grid c2" style={{ marginBottom: 14 }}>
            {Object.entries(KINDS).map(([k, v]) => (
              <button key={k} className={`format-tile ${kind === k ? 'on' : ''}`} onClick={() => setKind(k)}>
                <div className="ft-name">{v.icon} {v.label}</div>
              </button>
            ))}
          </div>
          <div className="field">
            <label>Link to (optional)</label>
            <select className="select" value={linked} onChange={(e) => setLinked(e.target.value)}>
              <option value="">Nothing</option>
              <optgroup label="Characters">{project.characters.map((c) => <option key={c.id} value={c.id}>{c.name || 'Unnamed'}</option>)}</optgroup>
              <optgroup label="Locations">{project.locations.map((l) => <option key={l.id} value={l.id}>{l.name || 'Unnamed'}</option>)}</optgroup>
            </select>
            <div className="help">Linking lets Claude read that character's or location's bible entry when writing briefs.</div>
          </div>
          <div className="row" style={{ marginTop: 16 }}><div className="spacer" /><button className="btn" onClick={() => setCreating(false)}>Cancel</button><button className="btn primary" onClick={create}>Create</button></div>
        </Modal>
      )}
    </div>
  );
}

function Studio({ project, design, update }) {
  const canvasRef = useRef();
  const setDesign = useCallback((patch) => {
    update((p) => ({ designs: p.designs.map((d) => (d.id === design.id ? { ...d, ...patch } : d)) }));
  }, [update, design.id]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div className="row" style={{ padding: '8px 14px', borderBottom: '1px solid var(--line)', background: 'var(--panel)' }}>
        <button className="btn sm ghost" onClick={() => update({ openDesignId: null })}>← All designs</button>
        <input className="title-input" style={{ fontFamily: 'var(--font-display)', fontSize: 18, background: 'transparent', border: '1px solid transparent', color: 'var(--text)', borderRadius: 6, padding: '2px 8px' }} value={design.title} onChange={(e) => setDesign({ title: e.target.value })} />
        <span className="tag">{KINDS[design.kind]?.label}</span>
        <div className="spacer" />
        <span className="faint small hide-sm">B pen · P pencil · E eraser · [ ] size · Space pan · Ctrl+scroll zoom</span>
      </div>
      <DrawingCanvas
        ref={canvasRef}
        design={design}
        onSave={setDesign}
        panelSlot={<AIPanel project={project} design={design} setDesign={setDesign} update={update} canvasRef={canvasRef} />}
      />
    </div>
  );
}

function AIPanel({ project, design, setDesign, update, canvasRef }) {
  const [busy, run] = useBusy();
  const [genBusy, runGen] = useBusy();
  const [style, setStyle] = useState(STYLES[0]);
  const provider = useSettings((s) => s.imageProvider);
  const ai = hasAI();
  const char = project.characters.find((c) => c.id === design.linkedId);
  const loc = project.locations.find((l) => l.id === design.linkedId);
  const subject = char
    ? `Character: ${char.name} (${char.role}, age ${char.age || '?'}). ${char.logline}. Look: ${char.look}. Wardrobe: ${char.wardrobe}. Flaw: ${char.flaw}. Arc: ${char.arc}.`
    : loc ? `Location: ${loc.name}. ${loc.desc}. Mood: ${loc.mood}.` : `Design: ${design.title}. Notes: ${design.notes}`;

  const brief = () => run(async () => {
    const res = await ask({
      system: 'You are a production designer and costume designer. Write practical visual direction a beginner can draw from.',
      content: `STORY:\n${projectContext(project)}\n\nWHAT TO DESIGN (${design.kind}):\n${subject}\n\nWrite a concise look brief (under 180 words): silhouette/shape language, key details, materials and textures, and how the look expresses who they are or what the place means. Include a 6-color palette and a single-paragraph prompt for an image generator (no character names, describe visually, include "${style}").`,
      schema: {
        type: 'object',
        properties: {
          brief: { type: 'string' },
          palette: { type: 'array', items: { type: 'object', properties: { hex: { type: 'string' }, name: { type: 'string' } }, required: ['hex', 'name'], additionalProperties: false } },
          imagePrompt: { type: 'string' },
        },
        required: ['brief', 'palette', 'imagePrompt'],
        additionalProperties: false,
      },
      maxTokens: 4000,
    });
    setDesign({ brief: res.brief, palette: res.palette, imagePrompt: res.imagePrompt });
  });

  const sketch = () => run(async () => {
    const res = await ask({
      system: 'You create simple, clean SVG concept sketches: clear silhouettes and shapes with flat fills from a limited palette. No text, no scripts, no external references.',
      content: `Make an SVG concept sketch for this ${design.kind} design.\n${subject}\n${design.brief ? 'Brief: ' + design.brief : ''}\nUse width="800" height="${Math.round((800 * design.height) / design.width)}" and a matching viewBox. Keep it simple enough to trace and refine by hand.`,
      schema: { type: 'object', properties: { svg: { type: 'string' }, note: { type: 'string' } }, required: ['svg', 'note'], additionalProperties: false },
      maxTokens: 16000,
    });
    const clean = res.svg.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son\w+="[^"]*"/gi, '');
    setDesign({ svg: clean, svgNote: res.note });
  });

  const critique = () => run(async () => {
    const img = canvasRef.current.composite(1024, 'image/jpeg', 0.85);
    const text = await ask({
      content: [
        imageBlock(img),
        { type: 'text', text: `This is my ${design.kind} design drawing for my script.\n${subject}\n${design.brief ? 'Intended brief: ' + design.brief : ''}\n\nGive encouraging, specific feedback in under 150 words: what reads well, whether it communicates who this is / what this place feels like, and 2-3 concrete things to try next. Assume I'm a beginner artist.` },
      ],
      maxTokens: 3000,
    });
    setDesign({ critique: text });
  });

  const generate = () => runGen(async () => {
    const prompt = `${design.imagePrompt || subject}, ${style}`;
    const url = await generateImage(prompt, { width: Math.min(1024, design.width), height: Math.min(1024, Math.round((Math.min(1024, design.width) * design.height) / design.width)) });
    setDesign({ generated: [url, ...(design.generated || [])].slice(0, 8) });
  });

  const svgUrl = design.svg ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(design.svg) : '';

  return (
    <>
      <div className="panel-sec">
        <h4>✨ Design assistant</h4>
        <div className="small muted" style={{ marginBottom: 8 }}>{char ? `Linked to ${char.name || 'character'}` : loc ? `Linked to ${loc.name}` : 'Not linked to a character or location'}</div>
        <div className="col" style={{ gap: 6 }}>
          <button className="btn sm" disabled={busy || !ai} onClick={brief}>{busy ? <span className="spinner" /> : '📝'} Write a look brief</button>
          <button className="btn sm" disabled={busy || !ai} onClick={sketch}>✏️ Sketch it for me (SVG)</button>
          <button className="btn sm" disabled={busy || !ai} onClick={critique}>👁 Critique my drawing</button>
          {!ai && <div className="faint small">Add a Claude key in Settings for briefs, sketches and critiques. Concept art below is free.</div>}
        </div>
        {design.brief && (
          <div style={{ marginTop: 10 }}>
            <div className="small" style={{ whiteSpace: 'pre-wrap' }}>{design.brief}</div>
            {design.palette?.length > 0 && (
              <div className="row wrap" style={{ gap: 4, marginTop: 8 }}>
                {design.palette.map((p) => <div key={p.hex + p.name} className="swatch" title={`${p.name} ${p.hex}`} style={{ background: p.hex, width: 30 }} onClick={() => canvasRef.current.setColor(p.hex)} />)}
              </div>
            )}
          </div>
        )}
        {design.critique && <div className="card inset small" style={{ marginTop: 10, padding: 10, whiteSpace: 'pre-wrap' }}><b>Feedback:</b> {design.critique}</div>}
        {svgUrl && (
          <div style={{ marginTop: 10 }}>
            <div className="svg-box"><img src={svgUrl} alt="Claude's sketch" style={{ width: '100%' }} /></div>
            {design.svgNote && <div className="why" style={{ marginTop: 4 }}>{design.svgNote}</div>}
            <button className="btn xs" style={{ marginTop: 6 }} onClick={() => canvasRef.current.placeImage(svgUrl, 'Claude sketch')}>Place on canvas</button>
          </div>
        )}
      </div>

      <div className="panel-sec">
        <h4>🖼 Concept art</h4>
        <textarea className="textarea" rows={3} value={design.imagePrompt} onChange={(e) => setDesign({ imagePrompt: e.target.value })} placeholder="Describe the image, e.g. a weathered lighthouse keeper in an oilskin coat, salt-white hair, standing in rain" />
        <select className="select" style={{ marginTop: 6 }} value={style} onChange={(e) => setStyle(e.target.value)}>{STYLES.map((s) => <option key={s}>{s}</option>)}</select>
        <button className="btn sm primary" style={{ marginTop: 6, width: '100%' }} disabled={genBusy || provider === 'none' || (!design.imagePrompt && !char && !loc)} onClick={generate}>
          {genBusy ? <><span className="spinner" /> Generating…</> : 'Generate image'}
        </button>
        <div className="faint small" style={{ marginTop: 4 }}>{provider === 'openai' ? 'Using OpenAI images.' : 'Free via Pollinations.ai. Takes 5–20 seconds.'} Click a result to place it on the canvas.</div>
        <div className="grid c2" style={{ gap: 6, marginTop: 8 }}>
          {(design.generated || []).map((g, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <img className="gen-img" src={g} alt="" onClick={() => canvasRef.current.placeImage(g, 'Concept art')} />
              <button className="btn xs ghost" style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,.5)' }} onClick={() => setDesign({ generated: design.generated.filter((_, j) => j !== i) })}>✕</button>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-sec">
        <h4>Notes</h4>
        <textarea className="textarea" rows={3} value={design.notes} onChange={(e) => setDesign({ notes: e.target.value })} placeholder="References, fabric ideas, what changes in Act 3…" />
      </div>

      <div className="panel-sec col" style={{ gap: 6 }}>
        <button className="btn sm" onClick={() => {
          const a = document.createElement('a');
          a.href = canvasRef.current.composite(design.width, 'image/png');
          a.download = `${design.title.replace(/[^\w\- ]+/g, '') || 'design'}.png`;
          a.click();
        }}>⤓ Export PNG</button>
        {char && <button className="btn sm" onClick={() => {
          update((p) => ({ characters: p.characters.map((c) => (c.id === char.id ? { ...c, portrait: canvasRef.current.composite(320, 'image/jpeg', 0.85) } : c)) }));
          toast(`Set as ${char.name}'s portrait`, 'ok');
        }}>Use as {char.name || 'character'}'s portrait</button>}
      </div>
    </>
  );
}
