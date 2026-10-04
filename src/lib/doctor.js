// Rule-based Script Doctor. Runs instantly and offline; each finding names a
// craft principle so the note teaches as well as flags. The AI review in the
// Doctor view adds deeper story analysis on top of this.
import { FORMATS } from '../data/formats';
import { STRUCTURES } from '../data/structures';
import { paginate, scenesOf, wrap, displayText } from './layout';
import { ELEMENTS } from '../data/formats';

const ON_THE_NOSE = [
  /\bas you know\b/i, /\bi feel (so )?(sad|angry|happy|scared|alone|betrayed)\b/i, /\blet me explain\b/i,
  /\bi am (so )?(angry|sad|upset|hurt) (because|that)\b/i, /\bwhat are you saying\b/i, /\byou know what this means\b/i,
];
const CAMERA = /\b(we see|we hear|camera (pans|zooms|moves|tracks)|pan to|zoom (in|out)|angle on|close on)\b/i;

export function runDoctor(project) {
  const notes = [];
  const add = (severity, area, title, detail, blockId) => notes.push({ severity, area, title, detail, blockId });
  const fmt = FORMATS[project.format];
  const blocks = project.script || [];
  const { pages, pageOf } = paginate(blocks);
  const pageCount = blocks.some((b) => b.text?.trim()) ? pages.length : 0;
  const scenes = scenesOf(blocks);

  // ---------- Foundation ----------
  if (!project.logline?.trim()) add('high', 'Foundation', 'No logline yet', 'A one-sentence logline is your compass. Without it, scenes drift. Try: When [inciting incident], a [specific hero] must [goal] or else [stakes].');
  else {
    const words = project.logline.trim().split(/\s+/).length;
    if (words > 50) add('low', 'Foundation', 'Logline is long', `Your logline is ${words} words. Aim for under 35 so it can be said in one breath.`);
    if (!/\b(must|has to|needs to|tries to|races|fights|struggles)\b/i.test(project.logline)) add('low', 'Foundation', 'Logline may lack a clear goal', 'Strong loglines include an active goal: "must…", "races to…", "fights to…".');
  }
  const leads = (project.characters || []).filter((c) => c.role === 'Protagonist');
  if (!leads.length) add('high', 'Character', 'No protagonist defined', 'Mark one character as Protagonist in the Bible so GODLIKE can track their arc.');
  for (const c of leads) {
    if (!c.want?.trim()) add('med', 'Character', `${c.name || 'Protagonist'} has no clear WANT`, 'The want is the external goal that drives the plot. What are they actively chasing?');
    if (!c.need?.trim()) add('med', 'Character', `${c.name || 'Protagonist'} has no inner NEED`, 'The need is the inner change that gives the story meaning. What must they learn?');
  }
  if (!(project.characters || []).some((c) => c.role === 'Antagonist')) add('low', 'Character', 'No antagonist defined', 'Who or what opposes your hero? It can be a person, a group, nature or the hero\'s own flaw, but give it a face.');

  // Beat holes
  const structure = STRUCTURES[project.structure];
  if (structure) {
    const missing = structure.beats.filter((b) => !project.beats?.[b.id]?.trim() && !project.cards?.some((c) => c.beatId === b.id));
    if (missing.length && missing.length < structure.beats.length) {
      add('med', 'Structure', `${missing.length} story beat${missing.length > 1 ? 's' : ''} still open`, `Holes in your outline: ${missing.map((b) => b.name).join(', ')}. Open the Beat Board to fill them.`);
    } else if (missing.length === structure.beats.length) {
      add('med', 'Structure', 'No beats mapped yet', 'Mapping the big turning points before writing saves you from rewriting later. Try the Beat Board.');
    }
  }

  // ---------- Length ----------
  if (pageCount && fmt) {
    const [lo, hi] = fmt.pages;
    if (pageCount > hi) add('med', 'Length', `Script is long: ${pageCount} pages`, `${fmt.name} scripts usually run ${lo}–${hi} pages. Readers notice long scripts before they read a word.`);
    else if (pageCount >= 3 && pageCount < lo * 0.6) add('info', 'Length', `${pageCount} pages so far`, `Target is ${lo}–${hi} pages for a ${fmt.name}. Keep going!`);
  }

  // ---------- Scenes ----------
  const isScreen = !['stagePlay', 'audioDrama'].includes(project.format);
  for (const s of scenes) {
    if (s.type === 'scene' && isScreen) {
      const h = s.heading.toUpperCase();
      if (s.heading !== '(opening)' && !/^(INT\.?|EXT\.?|INT\.?\/EXT\.?|I\/E\.?)\s/.test(h)) add('med', 'Format', 'Scene heading missing INT./EXT.', `"${s.heading}" should start with INT. or EXT. so the production knows where it's shot.`, s.id);
      else if (s.heading !== '(opening)' && !/ - /.test(h)) add('low', 'Format', 'Scene heading missing time of day', `"${s.heading}" should end with " - DAY", " - NIGHT", etc.`, s.id);
    }
    const startPage = pageOf[s.id];
    const endPage = pageOf[s.blocks[s.blocks.length - 1].id];
    const len = endPage - startPage + 1;
    if (len > 4 && isScreen) add('low', 'Pacing', `Long scene (${len} pages)`, `"${s.heading}" runs about ${len} pages. Most scenes run 1–3. Can you enter later or leave earlier?`, s.id);
  }

  // Location consistency: same name modulo punctuation/spaces but spelled differently.
  const locs = {};
  for (const s of scenes) {
    const loc = s.heading.toUpperCase().replace(/^(INT\.?\/EXT\.?|I\/E\.?|INT\.?|EXT\.?)\s*/, '').split(' - ')[0].trim();
    if (!loc) continue;
    const key = loc.replace(/[^A-Z0-9]/g, '');
    (locs[key] ||= new Set()).add(loc);
  }
  for (const set of Object.values(locs)) {
    if (set.size > 1) add('low', 'Format', 'Inconsistent location names', `These look like the same place: ${[...set].join(' / ')}. Pick one spelling so the schedule stays accurate.`);
  }

  // ---------- Blocks ----------
  let actionLong = 0, speechLong = 0, parens = 0, dialogues = 0, adverbs = 0, camera = 0, otn = 0;
  const firstSpeech = {};
  const actionText = [];
  blocks.forEach((b, i) => {
    const t = b.text || '';
    const el = ELEMENTS[b.type];
    if (!el || !t.trim()) return;
    const lines = wrap(displayText(b), el.width).length;
    if (b.type === 'action') {
      actionText.push({ i, t });
      if (lines > 5) { actionLong++; if (actionLong <= 3) add('low', 'Style', 'Dense action paragraph', `An action block runs ${lines} lines. Break it up; white space keeps readers moving.`, b.id); }
      const ly = t.match(/\b\w{4,}ly\b/g) || [];
      adverbs += ly.filter((w) => !/^(only|family|early|reply|supply|holy|ugly|belly|bully|jelly|rally|fly|lonely|lovely|friendly|elderly|likely)$/i.test(w)).length;
      if (CAMERA.test(t)) { camera++; if (camera <= 2) add('low', 'Style', 'Camera direction in action', 'Phrases like "we see" or "camera pans" pull the reader out. Describe what happens and let the director choose the shot.', b.id); }
    }
    if (b.type === 'dialogue') {
      dialogues++;
      if (lines > 8) { speechLong++; if (speechLong <= 3) add('low', 'Dialogue', 'Long speech', `A speech runs ${lines} lines. Long speeches can work, but make sure every line earns its place. Could another character interrupt?`, b.id); }
      if (ON_THE_NOSE.some((r) => r.test(t))) { otn++; if (otn <= 3) add('med', 'Dialogue', 'Possibly on-the-nose dialogue', `"${t.slice(0, 70)}${t.length > 70 ? '…' : ''}" states feelings or information directly. Can the subtext do the work?`, b.id); }
    }
    if (b.type === 'parenthetical') parens++;
    if (b.type === 'character') {
      const name = t.replace(/\(.*?\)/g, '').trim().toUpperCase();
      if (name && firstSpeech[name] === undefined) firstSpeech[name] = i;
    }
  });
  if (dialogues > 10 && parens / dialogues > 0.35) add('low', 'Dialogue', 'Heavy use of parentheticals', `${parens} parentheticals for ${dialogues} speeches. Trust the actors; cut any that just repeat what the line already says.`);
  if (adverbs > 8) add('info', 'Style', `${adverbs} adverbs in action lines`, 'Strong verbs beat adverb + weak verb: "walks slowly" → "trudges".');

  // Character introductions: name should appear in CAPS in action before first speech.
  for (const [name, idx] of Object.entries(firstSpeech)) {
    const introduced = actionText.some(({ i, t }) => i < idx && t.includes(name));
    if (!introduced && !/^(NARRATOR|VOICE|ANNOUNCER|ALL|BOTH)/.test(name)) {
      add('low', 'Character', `${name} speaks before being introduced`, `Introduce ${name} in an action line before they speak: name in CAPS, age, and one telling detail.`, blocks[idx].id);
    }
  }

  // Protagonist presence
  if (leads.length && scenes.length >= 6) {
    const lead = (leads[0].name || '').toUpperCase();
    if (lead) {
      const present = scenes.filter((s) => s.blocks.some((b) => (b.text || '').toUpperCase().includes(lead))).length;
      const pct = Math.round((present / scenes.length) * 100);
      if (pct < 40) add('med', 'Character', `${leads[0].name} appears in only ${pct}% of scenes`, 'Audiences follow the protagonist. If they\'re absent too long, the story can feel like it belongs to someone else.');
    }
  }

  const order = { high: 0, med: 1, low: 2, info: 3 };
  notes.sort((a, b) => order[a.severity] - order[b.severity]);

  const stats = {
    pages: pageCount,
    scenes: scenes.filter((s) => s.heading !== '(opening)').length,
    speakingCharacters: Object.keys(firstSpeech).length,
    words: blocks.reduce((n, b) => n + (b.text?.trim() ? b.text.trim().split(/\s+/).length : 0), 0),
    dialoguePct: (() => {
      const d = blocks.filter((b) => b.type === 'dialogue').reduce((n, b) => n + (b.text || '').length, 0);
      const all = blocks.reduce((n, b) => n + (b.text || '').length, 0) || 1;
      return Math.round((d / all) * 100);
    })(),
  };
  return { notes, stats };
}
