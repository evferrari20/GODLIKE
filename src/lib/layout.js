// Industry pagination shared by the editor (page markers, page count) and the
// PDF export. Courier 12pt = 10 characters per inch and 6 lines per inch.
// A US Letter page with 1" top and bottom margins holds 54 lines.
import { ELEMENTS } from '../data/formats';

export const LINES_PER_PAGE = 54;
const CPI = 10;

// Blank lines that precede each element type.
export const SPACE_BEFORE = {
  scene: 1, action: 1, character: 1, parenthetical: 0, dialogue: 0, transition: 1,
  shot: 1, actBreak: 2, coldOpen: 1, actHeading: 2, sceneHeading: 1, stageDirection: 1,
  sound: 1, music: 1, narrator: 1,
};

export function wrap(text, widthInches) {
  const max = Math.max(8, Math.floor(widthInches * CPI));
  const out = [];
  for (const para of String(text || '').split('\n')) {
    if (!para) { out.push(''); continue; }
    let line = '';
    for (const word of para.split(/(\s+)/)) {
      if (!word) continue;
      if ((line + word).length > max) {
        if (line.trim()) out.push(line.trimEnd());
        line = word.trimStart();
        while (line.length > max) { out.push(line.slice(0, max)); line = line.slice(max); }
      } else {
        line += word;
      }
    }
    out.push(line.trimEnd());
  }
  return out;
}

export function displayText(block) {
  const el = ELEMENTS[block.type] || ELEMENTS.action;
  let t = block.text || '';
  if (block.type === 'parenthetical' && t && !t.startsWith('(')) t = `(${t})`;
  if (block.type === 'stageDirection' && t && !t.startsWith('(')) t = `(${t})`;
  if (block.type === 'sound' && t && !/^SFX/i.test(t)) t = `SFX: ${t}`;
  if (block.type === 'music' && t && !/^MUSIC/i.test(t)) t = `MUSIC: ${t}`;
  return el.caps ? t.toUpperCase() : t;
}

/**
 * Lay out blocks into pages. Returns { pages: [[{block, lines, el}]], pageOf: {blockId: n} }.
 * Keeps scene headings with what follows and character cues with dialogue.
 */
export function paginate(blocks) {
  const pages = [[]];
  const pageOf = {};
  let used = 0;
  const items = blocks.map((b) => {
    const el = ELEMENTS[b.type] || ELEMENTS.action;
    return { block: b, el, lines: wrap(displayText(b), el.width), before: SPACE_BEFORE[b.type] ?? 1 };
  });

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const before = used === 0 ? 0 : it.before;
    let need = before + it.lines.length;
    // Keep-with-next: a heading or cue must not be the last thing on a page.
    if (['scene', 'character', 'sceneHeading', 'shot'].includes(it.block.type) && items[i + 1]) {
      let j = i + 1;
      let extra = items[j].before + items[j].lines.length;
      if (it.block.type === 'character' && items[j].block.type === 'parenthetical' && items[j + 1]) {
        extra += items[j + 1].lines.length;
      }
      need += Math.min(extra, 3);
    }
    if (used + need > LINES_PER_PAGE && used > 0) {
      pages.push([]);
      used = 0;
    }
    const blank = used === 0 ? 0 : it.before;
    pages[pages.length - 1].push({ ...it, before: blank });
    pageOf[it.block.id] = pages.length;
    used += blank + it.lines.length;
  }
  return { pages, pageOf };
}

export function scenesOf(blocks) {
  const sceneTypes = new Set(['scene', 'sceneHeading', 'coldOpen', 'actBreak', 'actHeading']);
  const scenes = [];
  let cur = null;
  blocks.forEach((b, i) => {
    if (sceneTypes.has(b.type)) {
      cur = { id: b.id, index: i, heading: b.text || '(untitled scene)', type: b.type, blocks: [b] };
      scenes.push(cur);
    } else if (cur) {
      cur.blocks.push(b);
    } else {
      cur = { id: b.id, index: i, heading: '(opening)', type: 'scene', blocks: [b] };
      scenes.push(cur);
    }
  });
  return scenes;
}
