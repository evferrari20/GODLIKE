import { useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useActiveProject, useProjects, useSettings, uid, toast } from '../store';
import { ELEMENTS, NEXT_ON_ENTER, FORMATS, tabCycle } from '../data/formats';
import { ELEMENT_TIPS } from '../data/tips';
import { paginate, scenesOf, SPACE_BEFORE } from '../lib/layout';
import SceneAssistant from '../components/SceneAssistant';
import { ConfirmButton } from '../components/ui';

const PAPER_IN = 8.5;
const TIMES = ['DAY', 'NIGHT', 'MORNING', 'EVENING', 'DAWN', 'DUSK', 'CONTINUOUS', 'LATER', 'MOMENTS LATER'];

export default function ScriptEditor({ go }) {
  const project = useActiveProject();
  const update = useProjects((s) => s.update);
  const tipsOn = useSettings((s) => s.tips);
  const blocks = project.script;
  const fmt = FORMATS[project.format];
  const cycle = useMemo(() => tabCycle(project.format), [project.format]);

  const [focus, setFocus] = useState({ id: blocks[0]?.id, caret: 0 });
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);
  const refs = useRef({});
  const history = useRef({ past: [], future: [], last: 0 });

  // ---------- state changes with undo ----------
  const commit = useCallback((next, { structural = false } = {}) => {
    const h = history.current;
    const now = Date.now();
    if (structural || now - h.last > 800) {
      h.past.push(useProjects.getState().projects[project.id].script);
      if (h.past.length > 200) h.past.shift();
      h.future = [];
    }
    h.last = now;
    update({ script: next });
  }, [project.id, update]);

  const undo = () => {
    const h = history.current;
    if (!h.past.length) return;
    h.future.push(blocks);
    update({ script: h.past.pop() });
    h.last = 0;
  };
  const redo = () => {
    const h = history.current;
    if (!h.future.length) return;
    h.past.push(blocks);
    update({ script: h.future.pop() });
    h.last = 0;
  };

  const indexOf = (id) => blocks.findIndex((b) => b.id === id);
  const setBlock = (id, patch, opts) => commit(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)), opts);

  const insertAfter = (id, newBlocks) => {
    const i = id ? indexOf(id) : blocks.length - 1;
    const next = [...blocks.slice(0, i + 1), ...newBlocks, ...blocks.slice(i + 1)];
    commit(next, { structural: true });
    const last = newBlocks[newBlocks.length - 1];
    setFocus({ id: last.id, caret: last.text.length });
  };

  // ---------- focus management ----------
  useLayoutEffect(() => {
    const el = refs.current[focus.id];
    if (el && document.activeElement !== el) {
      el.focus();
      const c = Math.min(focus.caret ?? el.value.length, el.value.length);
      el.setSelectionRange(c, c);
    }
  }, [focus]);

  // ---------- known names for autocomplete ----------
  const knownNames = useMemo(() => {
    const s = new Set(project.characters.map((c) => c.name.toUpperCase()).filter(Boolean));
    for (const b of blocks) if (b.type === 'character' && b.text.trim()) s.add(b.text.replace(/\s*\(.*$/, '').trim().toUpperCase());
    return [...s].sort();
  }, [blocks, project.characters]);
  const knownLocations = useMemo(() => {
    const s = new Set(project.locations.map((l) => l.name.toUpperCase()).filter(Boolean));
    for (const b of blocks) if (b.type === 'scene') {
      const loc = b.text.toUpperCase().replace(/^(INT\.?\/EXT\.?|I\/E\.?|INT\.?|EXT\.?)\s*/, '').split(' - ')[0].trim();
      if (loc) s.add(loc);
    }
    return [...s].sort();
  }, [blocks, project.locations]);

  // ---------- pagination ----------
  const deferred = useDeferredValue(blocks);
  const { pages, pageOf } = useMemo(() => paginate(deferred), [deferred]);
  const scenes = useMemo(() => scenesOf(blocks), [blocks]);
  const focusBlock = blocks.find((b) => b.id === focus.id) || blocks[0];
  const currentScene = useMemo(() => {
    const i = indexOf(focusBlock?.id);
    return [...scenes].reverse().find((s) => s.index <= i) || scenes[0];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenes, focusBlock?.id]);
  const words = useMemo(() => blocks.reduce((n, b) => n + (b.text.trim() ? b.text.trim().split(/\s+/).length : 0), 0), [blocks]);

  // ---------- keyboard ----------
  const onKeyDown = (e, b, sugg) => {
    const el = e.target;
    const i = indexOf(b.id);
    const atStart = el.selectionStart === 0 && el.selectionEnd === 0;
    const atEnd = el.selectionStart === el.value.length;
    const mod = e.metaKey || e.ctrlKey;

    if (sugg.items.length && sugg.open) {
      if (e.key === 'ArrowDown') { e.preventDefault(); return sugg.move(1); }
      if (e.key === 'ArrowUp') { e.preventDefault(); return sugg.move(-1); }
      if (e.key === 'Escape') { e.preventDefault(); return sugg.close(); }
      if ((e.key === 'Enter' || e.key === 'Tab') && sugg.index >= 0) { e.preventDefault(); return sugg.accept(); }
    }

    if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); return e.shiftKey ? redo() : undo(); }
    if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); return redo(); }
    if (mod && /^[1-9]$/.test(e.key)) {
      const t = cycle[Number(e.key) - 1];
      if (t) { e.preventDefault(); setBlock(b.id, { type: t }, { structural: true }); }
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      // Quick INT./EXT. expansion
      if (b.type === 'scene' && /^(i|e|ie)$/i.test(b.text.trim())) {
        const t = { i: 'INT. ', e: 'EXT. ', ie: 'INT./EXT. ' }[b.text.trim().toLowerCase()];
        setBlock(b.id, { text: t });
        return setFocus({ id: b.id, caret: t.length });
      }
      const pos = cycle.indexOf(b.type);
      const nextType = cycle[(pos + (e.shiftKey ? -1 : 1) + cycle.length) % cycle.length];
      setBlock(b.id, { type: nextType }, { structural: true });
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Enter on an empty line changes its type instead of adding blank lines.
      if (!b.text.trim()) {
        const t = b.type === 'action' ? 'scene' : 'action';
        if (fmt.elements.includes(t)) setBlock(b.id, { type: t }, { structural: true });
        return;
      }
      const before = el.value.slice(0, el.selectionStart);
      const after = el.value.slice(el.selectionEnd);
      let nextType = NEXT_ON_ENTER[b.type] || 'action';
      if (!fmt.elements.includes(nextType)) nextType = fmt.elements.includes('action') ? 'action' : fmt.elements[0];
      const nb = { id: uid(), type: after ? b.type : nextType, text: after };
      const next = [...blocks];
      next[i] = { ...b, text: before };
      next.splice(i + 1, 0, nb);
      commit(next, { structural: true });
      return setFocus({ id: nb.id, caret: 0 });
    }

    if (e.key === 'Backspace' && atStart && i > 0) {
      e.preventDefault();
      const prev = blocks[i - 1];
      const next = blocks.filter((x) => x.id !== b.id).map((x) => (x.id === prev.id ? { ...x, text: x.text + b.text } : x));
      commit(next, { structural: true });
      return setFocus({ id: prev.id, caret: prev.text.length });
    }

    if (e.key === 'ArrowUp' && i > 0 && !el.value.slice(0, el.selectionStart).includes('\n') && isFirstVisualLine(el)) {
      e.preventDefault();
      return setFocus({ id: blocks[i - 1].id, caret: blocks[i - 1].text.length });
    }
    if (e.key === 'ArrowDown' && i < blocks.length - 1 && atEnd) {
      e.preventDefault();
      return setFocus({ id: blocks[i + 1].id, caret: 0 });
    }
  };

  const onChange = (b, text) => {
    let type = b.type;
    // Smart detection, the way pro editors do it.
    if (type === 'action' && /^(int|ext|int\/ext|i\/e|est)[. ]/i.test(text) && fmt.elements.includes('scene')) type = 'scene';
    if (type === 'action' && /^[A-Z][A-Z .']+TO:$/.test(text.trim()) && fmt.elements.includes('transition')) type = 'transition';
    if ((type === 'character' || type === 'dialogue') && text.startsWith('(') && b.text === '' && fmt.elements.includes('parenthetical')) type = 'parenthetical';
    setBlock(b.id, { text, type });
  };

  const deleteScene = (scene) => {
    const ids = new Set(scene.blocks.map((b) => b.id));
    let next = blocks.filter((b) => !ids.has(b.id));
    if (!next.length) next = [{ id: uid(), type: fmt.elements.includes('scene') ? 'scene' : fmt.elements[0], text: '' }];
    commit(next, { structural: true });
    const after = next[Math.min(scene.index, next.length - 1)];
    setFocus({ id: after.id, caret: 0 });
    toast('Scene deleted. Ctrl+Z brings it back.');
  };

  const jumpTo = (id) => {
    setFocus({ id, caret: 0 });
    refs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const sceneNo = {};
  let n = 0;
  for (const s of scenes) if (s.type === 'scene' || s.type === 'sceneHeading') sceneNo[s.id] = ++n;

  const wrapCls = `editor-wrap ${showLeft ? '' : 'no-left'} ${showRight ? '' : 'no-right'}`;
  const pageNow = pageOf[focusBlock?.id] || 1;
  const tipList = ELEMENT_TIPS[focusBlock?.type] || [];
  const tip = tipList[(pageNow + indexOf(focusBlock?.id)) % (tipList.length || 1)];

  return (
    <div className={wrapCls} style={{ flex: 1, minHeight: 0 }}>
      {showLeft && (
        <div className="side">
          <div className="row" style={{ marginBottom: 8 }}>
            <div className="eyebrow">Scenes</div><div className="spacer" />
            <span className="faint small">{n}</span>
          </div>
          {scenes.map((s) => (
            <div key={s.id} className={`scene-nav-item ${['actBreak', 'coldOpen', 'actHeading'].includes(s.type) ? 'act' : ''}`} onClick={() => jumpTo(s.id)}
              style={currentScene?.id === s.id ? { background: 'var(--wood-soft)', color: 'var(--text)' } : null}>
              <span className="num">{sceneNo[s.id] || ''}</span>
              <span className="grow" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>{s.heading || '—'}</span>
              <span className="nav-del"><ConfirmButton className="xs ghost danger" onConfirm={() => deleteScene(s)}>✕</ConfirmButton></span>
            </div>
          ))}
          {!scenes.length && <div className="faint small">Your scenes will appear here as you add scene headings.</div>}
        </div>
      )}

      <div className="editor-center">
        <div className="editor-toolbar">
          <button className="btn xs ghost" onClick={() => setShowLeft((v) => !v)} title="Toggle scene list">☰</button>
          <select className="select el-select" value={focusBlock?.type} onChange={(e) => setBlock(focusBlock.id, { type: e.target.value }, { structural: true })}>
            {fmt.elements.map((t) => <option key={t} value={t}>{ELEMENTS[t].label}</option>)}
          </select>
          <span className="faint small hide-sm">
            <span className="kbd">Tab</span> change element · <span className="kbd">Enter</span> next · <span className="kbd">Ctrl+1–{cycle.length}</span> jump
          </span>
          <div className="spacer" />
          <button className="btn xs ghost" onClick={undo} title="Undo (Ctrl+Z)">↶</button>
          <button className="btn xs ghost" onClick={redo} title="Redo (Ctrl+Shift+Z)">↷</button>
          <button className="btn xs" onClick={() => insertAfter(currentScene?.blocks.at(-1)?.id || blocks.at(-1).id, [{ id: uid(), type: fmt.elements.includes('scene') ? 'scene' : fmt.elements[0], text: '' }])}>+ Scene</button>
          <button className="btn xs ghost" onClick={() => setShowRight((v) => !v)} title="Toggle assistant">✨ Assistant</button>
        </div>

        <div className="paper-scroll">
          <div className="paper">
            {blocks.map((b, i) => {
              const prevPage = i > 0 ? pageOf[blocks[i - 1].id] : 1;
              const pg = pageOf[b.id];
              return (
                <div key={b.id}>
                  {pg && prevPage && pg > prevPage && <div className="page-break"><span>{pg}.</span></div>}
                  <Block
                    b={b}
                    first={i === 0 || (pg && prevPage && pg > prevPage)}
                    focused={focus.id === b.id}
                    sceneNo={sceneNo[b.id]}
                    refCb={(el) => (refs.current[b.id] = el)}
                    onFocus={() => focus.id !== b.id && setFocus({ id: b.id, caret: null })}
                    onChange={(t) => onChange(b, t)}
                    onKeyDown={onKeyDown}
                    names={knownNames}
                    locations={knownLocations}
                    setText={(t) => { setBlock(b.id, { text: t }); setFocus({ id: b.id, caret: t.length }); }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="statusbar">
          <span>Page {pageNow} of {pages.length}</span>
          <span>{n} scenes</span>
          <span>{words.toLocaleString()} words</span>
          <span>Target {fmt.pages[0]}–{fmt.pages[1]} pp</span>
          <div className="spacer" />
          {tipsOn && tip && <span className="tip-line" style={{ color: 'var(--wood)' }}>💡 {tip}</span>}
        </div>
      </div>

      {showRight && (
        <div className="side right">
          <SceneAssistant project={project} scene={currentScene} focusBlock={focusBlock} insertAfter={insertAfter} setBlock={setBlock} deleteScene={deleteScene} go={go} />
        </div>
      )}
    </div>
  );
}

function isFirstVisualLine(el) {
  // Approximation: if the caret is within the first row's worth of characters.
  const cols = Math.max(10, Math.floor(el.clientWidth / 9.6));
  return el.selectionStart <= cols;
}

function Block({ b, first, focused, sceneNo, refCb, onFocus, onChange, onKeyDown, names, locations, setText }) {
  const el = ELEMENTS[b.type] || ELEMENTS.action;
  const taRef = useRef();
  const [suggIndex, setSuggIndex] = useState(() => (b.text ? 0 : -1));
  const [closed, setClosed] = useState(false);

  useLayoutEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = '0px';
    ta.style.height = ta.scrollHeight + 'px';
  });

  // Autocomplete suggestions for characters and scene headings.
  const items = useMemo(() => {
    if (!focused || closed) return [];
    const t = b.text.toUpperCase();
    if (b.type === 'character') {
      if (!t) return names.slice(0, 8);
      return names.filter((n) => n.startsWith(t) && n !== t).slice(0, 8);
    }
    if (b.type === 'scene') {
      if (!t) return ['INT. ', 'EXT. ', 'INT./EXT. '];
      const m = t.match(/^(INT\.?\/EXT\.?|I\/E\.?|INT\.?|EXT\.?)\s+(.*)$/);
      if (!m) return [];
      const [, prefix, rest] = m;
      if (rest.includes(' - ')) {
        const [loc, tm] = rest.split(' - ');
        return TIMES.filter((x) => x.startsWith(tm) && x !== tm).map((x) => `${prefix} ${loc} - ${x}`);
      }
      return locations.filter((l) => l.startsWith(rest) && l !== rest).slice(0, 8).map((l) => `${prefix} ${l} - `);
    }
    return [];
  }, [focused, closed, b.text, b.type, names, locations]);

  useEffect(() => { setSuggIndex(b.text ? 0 : -1); setClosed(false); }, [b.text, b.type]);

  const sugg = {
    items, open: items.length > 0, index: suggIndex,
    move: (d) => setSuggIndex((i) => (i + d + items.length) % items.length),
    close: () => setClosed(true),
    accept: () => items[suggIndex] && setText(items[suggIndex]),
  };

  const before = first ? 0 : SPACE_BEFORE[b.type] ?? 1;
  const cls = ['blk', b.type, focused && 'focused', el.caps && 'caps', el.italic && 'italic', el.align, el.underline && 'underline'].filter(Boolean).join(' ');
  return (
    <div
      className={cls}
      data-label={el.label}
      style={{ marginLeft: `${((el.left - 0) / PAPER_IN) * 100}%`, width: `${(el.width / PAPER_IN) * 100}%`, marginTop: `${before}em` }}
    >
      {sceneNo && b.type === 'scene' && <span style={{ position: 'absolute', right: '100%', marginRight: 12, color: '#b9a990', fontSize: '10pt' }}>{sceneNo}</span>}
      <textarea
        ref={(n) => { taRef.current = n; refCb(n); }}
        rows={1}
        value={b.text}
        spellCheck
        placeholder={focused ? el.hint : ''}
        onFocus={onFocus}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => onKeyDown(e, b, sugg)}
      />
      {sugg.open && (
        <div className="suggest">
          {items.map((s, i) => (
            <div key={s} className={i === suggIndex ? 'on' : ''} onMouseDown={(e) => { e.preventDefault(); setText(s); }}>{s}</div>
          ))}
        </div>
      )}
    </div>
  );
}
