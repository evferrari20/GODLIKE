import { useRef, useState } from 'react';
import { useProjects, toast } from '../store';
import { FORMATS, FORMAT_GROUPS } from '../data/formats';
import { Modal, Lesson } from '../components/ui';
import { readBackup } from '../lib/exporters';
import { paginate } from '../lib/layout';

export function FormatPicker({ value, onPick }) {
  return (
    <div className="col" style={{ gap: 18 }}>
      {FORMAT_GROUPS.map((g) => (
        <div key={g}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>{g}</div>
          <div className="grid auto">
            {Object.values(FORMATS).filter((f) => f.group === g).map((f) => (
              <button key={f.id} className={`format-tile ${value === f.id ? 'on' : ''}`} onClick={() => onPick(f.id)}>
                <div className="ft-name">{f.name}</div>
                <div className="ft-meta">{f.pages[0]}–{f.pages[1]} pages · {f.runtime}</div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home({ go }) {
  const { projects, createProject, setActive, deleteProject, duplicateProject, importProject } = useProjects();
  const [picking, setPicking] = useState(false);
  const [fmt, setFmt] = useState('short');
  const fileRef = useRef();
  const list = Object.values(projects).sort((a, b) => b.updatedAt - a.updatedAt);

  const start = (mode) => {
    createProject(fmt);
    setPicking(false);
    go(mode === 'wizard' ? 'wizard' : 'script');
  };

  const onImport = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      importProject(await readBackup(f));
      toast('Project imported', 'ok');
      go('script');
    } catch (err) {
      toast(err.message, 'error');
    }
    e.target.value = '';
  };

  return (
    <div className="view pad">
      <div className="hero-banner">
        <div className="slate-stripes" />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 640 }}>
          <div className="eyebrow" style={{ color: '#f0cf9f' }}>Screenwriting studio</div>
          <h1>Write the story only you can tell.</h1>
          <p style={{ color: '#ecdcc6', fontSize: 15.5, margin: '0 0 20px' }}>
            Never written a script? GODLIKE walks you from a spark of an idea to a professionally formatted
            screenplay, teleplay, stage play or audio drama, teaching you the craft as you go.
          </p>
          <div className="row wrap">
            <button className="btn wood" onClick={() => setPicking(true)}>✦ Start a new story</button>
            <button className="btn" onClick={() => fileRef.current.click()}>Import backup</button>
            <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={onImport} />
          </div>
        </div>
      </div>

      {list.length > 0 && (
        <>
          <h2>Your projects</h2>
          <div className="grid auto" style={{ marginBottom: 30 }}>
            {list.map((p) => {
              const pages = p.script?.some((b) => b.text?.trim()) ? paginate(p.script).pages.length : 0;
              const f = FORMATS[p.format];
              const pct = Math.min(100, Math.round((pages / f.pages[0]) * 100));
              return (
                <div key={p.id} className="card hover project-card" onClick={() => { setActive(p.id); go(p.wizardDone ? 'script' : 'wizard'); }}>
                  <div className="row"><span className="tag blue">{f.name}</span><div className="spacer" /><span className="faint small">{new Date(p.updatedAt).toLocaleDateString()}</span></div>
                  <h3>{p.title}</h3>
                  <div className="muted small" style={{ flex: 1 }}>{p.logline || p.idea || 'No logline yet.'}</div>
                  <div className="meter"><div style={{ width: pct + '%' }} /></div>
                  <div className="row small faint">
                    <span>{pages} / {f.pages[0]}+ pages</span>
                    <div className="spacer" />
                    <button className="btn xs ghost" onClick={(e) => { e.stopPropagation(); duplicateProject(p.id); }}>Duplicate</button>
                    <button className="btn xs ghost danger" onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${p.title}" forever?`)) deleteProject(p.id); }}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <h2>How GODLIKE works</h2>
      <div className="grid c3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {[
          ['✦', 'Story Wizard', 'Answer friendly questions to build your idea, logline, characters and story beats. Each step explains why it matters.'],
          ['▤', 'Beat Board', 'Arrange your story on index cards, act by act. Empty slots show you exactly where the holes are.'],
          ['❖', 'Story Bible', 'Characters, relationships, locations and world rules: everything you know about your story in one place.'],
          ['✎', 'Design Studio', 'Draw and design character looks, wardrobe and settings, with AI style briefs and concept art.'],
          ['¶', 'Script Editor', 'Formats as you type, like the pro tools. Tab and Enter do the work. A scene assistant offers ideas when you\'re stuck.'],
          ['✚', 'Script Doctor', 'Get notes like a professional reader would give: pacing, dialogue, structure and plot holes.'],
        ].map(([ico, t, d]) => (
          <div key={t} className="card">
            <div style={{ fontSize: 22, color: 'var(--wood)' }}>{ico}</div>
            <h3>{t}</h3>
            <div className="muted small">{d}</div>
          </div>
        ))}
      </div>

      {picking && (
        <Modal wide onClose={() => setPicking(false)}>
          <h2>What are you writing?</h2>
          <Lesson>{FORMATS[fmt].teach}</Lesson>
          <div style={{ margin: '18px 0' }}>
            <FormatPicker value={fmt} onPick={setFmt} />
          </div>
          <div className="row wrap">
            <span className="faint small">First script? A <b>Short Film</b> is the best place to learn.</span>
            <div className="spacer" />
            <button className="btn" onClick={() => start('blank')}>Skip to blank script</button>
            <button className="btn primary" onClick={() => start('wizard')}>Guide me step by step →</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
