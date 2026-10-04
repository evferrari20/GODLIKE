// Every format GODLIKE supports. `elements` lists which script elements the
// editor offers, `structure` points at a beat template in structures.js, and
// `teach` is the short primer shown when someone picks the format.

export const FORMATS = {
  feature: {
    id: 'feature',
    name: 'Feature Film',
    group: 'Film',
    pages: [90, 120],
    runtime: '90–120 min',
    minutesPerPage: 1,
    structure: 'saveTheCat',
    elements: ['scene', 'action', 'character', 'parenthetical', 'dialogue', 'transition', 'shot'],
    teach:
      'A feature screenplay runs roughly one page per minute of screen time. Most studio features land between 95 and 115 pages. The classic shape is three acts: set-up (pages 1–25), confrontation (25–90), resolution (90–110).',
  },
  short: {
    id: 'short',
    name: 'Short Film',
    group: 'Film',
    pages: [5, 20],
    runtime: '5–20 min',
    minutesPerPage: 1,
    structure: 'shortFilm',
    elements: ['scene', 'action', 'character', 'parenthetical', 'dialogue', 'transition', 'shot'],
    teach:
      'Shorts are the best place to learn. Aim for one idea, one main character, one turn. Fewer locations means it is actually shootable. The best shorts feel like a complete story, not a trailer for a feature.',
  },
  animatedFeature: {
    id: 'animatedFeature',
    name: 'Animated Feature',
    group: 'Film',
    pages: [80, 110],
    runtime: '80–100 min',
    minutesPerPage: 0.9,
    structure: 'saveTheCat',
    elements: ['scene', 'action', 'character', 'parenthetical', 'dialogue', 'transition', 'shot'],
    teach:
      'Animation scripts use screenplay format but lean harder on visual description: every frame must be designed and drawn, so your action lines are the art department\'s brief. Visual gags and physical comedy should be written out clearly.',
  },
  tvHalf: {
    id: 'tvHalf',
    name: 'TV Half-Hour (Single-Cam)',
    group: 'Television',
    pages: [25, 35],
    runtime: '22–30 min',
    minutesPerPage: 1,
    structure: 'tvHalfHour',
    elements: ['scene', 'action', 'character', 'parenthetical', 'dialogue', 'transition', 'shot', 'actBreak', 'coldOpen'],
    teach:
      'Single-camera comedies (think film-style comedy shows) read like mini-features: cold open, two or three acts, and a tag. Every scene should earn a laugh AND move the story.',
  },
  tvMulti: {
    id: 'tvMulti',
    name: 'TV Half-Hour (Multi-Cam Sitcom)',
    group: 'Television',
    pages: [45, 55],
    runtime: '22 min',
    minutesPerPage: 0.45,
    structure: 'tvHalfHour',
    elements: ['scene', 'action', 'character', 'parenthetical', 'dialogue', 'transition', 'actBreak', 'coldOpen'],
    teach:
      'Multi-cam sitcoms are filmed on stage before an audience. The format is double-spaced dialogue with action in CAPS, so pages run long, about two pages per minute. Scenes are lettered (A, B, C) and the sets are limited.',
  },
  tvHour: {
    id: 'tvHour',
    name: 'TV One-Hour Drama',
    group: 'Television',
    pages: [50, 65],
    runtime: '42–60 min',
    minutesPerPage: 1,
    structure: 'tvHour',
    elements: ['scene', 'action', 'character', 'parenthetical', 'dialogue', 'transition', 'shot', 'actBreak', 'coldOpen'],
    teach:
      'Hour-long dramas usually open with a teaser and break into 4–6 acts. Every act out must end on a hook strong enough to survive a commercial break. Streaming shows keep the shape even without ads.',
  },
  animatedTV: {
    id: 'animatedTV',
    name: 'Animated TV Episode',
    group: 'Television',
    pages: [30, 45],
    runtime: '11–22 min',
    minutesPerPage: 0.7,
    structure: 'tvHalfHour',
    elements: ['scene', 'action', 'character', 'parenthetical', 'dialogue', 'transition', 'shot', 'actBreak', 'coldOpen'],
    teach:
      'Animated episodes often run longer on the page than live action, because jokes are visual and described in detail. Some shows go straight to storyboard from an outline. Write your gags so an artist can draw them.',
  },
  webSeries: {
    id: 'webSeries',
    name: 'Web Series Episode',
    group: 'Digital',
    pages: [3, 15],
    runtime: '3–15 min',
    minutesPerPage: 1,
    structure: 'webEpisode',
    elements: ['scene', 'action', 'character', 'parenthetical', 'dialogue', 'transition', 'shot'],
    teach:
      'Web episodes hook fast: you have 15 seconds to earn the click. Open in the middle of action, keep one clear story per episode, and end on a reason to watch the next one.',
  },
  vertical: {
    id: 'vertical',
    name: 'Vertical / Micro-Drama',
    group: 'Digital',
    pages: [1, 3],
    runtime: '1–3 min per ep',
    minutesPerPage: 1,
    structure: 'verticalDrama',
    elements: ['scene', 'action', 'character', 'parenthetical', 'dialogue', 'shot'],
    teach:
      'Vertical micro-dramas are shot 9:16 for phones and come in dozens of 1–2 minute episodes. Each episode needs a hook in the first 5 seconds and a cliffhanger at the end. Favor close-ups, big emotions and reversals.',
  },
  stagePlay: {
    id: 'stagePlay',
    name: 'Stage Play',
    group: 'Stage & Audio',
    pages: [80, 120],
    runtime: '90–150 min',
    minutesPerPage: 1,
    structure: 'stagePlay',
    elements: ['actHeading', 'sceneHeading', 'stageDirection', 'character', 'parenthetical', 'dialogue'],
    teach:
      'Plays live in dialogue. The stage can\'t cut to a close-up, so character and conflict must come through what people say and do in a shared space. Stage directions are short and in italics. Scenes are numbered within acts.',
  },
  audioDrama: {
    id: 'audioDrama',
    name: 'Audio Drama / Podcast',
    group: 'Stage & Audio',
    pages: [20, 40],
    runtime: '20–45 min',
    minutesPerPage: 1,
    structure: 'audioEpisode',
    elements: ['scene', 'sound', 'music', 'character', 'parenthetical', 'dialogue', 'narrator'],
    teach:
      'In audio, the listener sees nothing. Every location, action and emotion must be carried by sound effects (SFX), music, and dialogue. Name characters often so listeners can track who is speaking.',
  },
  musicVideo: {
    id: 'musicVideo',
    name: 'Commercial / Music Video',
    group: 'Digital',
    pages: [1, 5],
    runtime: '0:30–5 min',
    minutesPerPage: 1,
    structure: 'shortFilm',
    elements: ['scene', 'action', 'shot', 'character', 'dialogue', 'transition'],
    teach:
      'Commercials and music videos are image-first. Write in vivid, shot-by-shot beats tied to timing (a lyric, a product reveal). Keep one emotional idea and one memorable image.',
  },
};

export const FORMAT_GROUPS = ['Film', 'Television', 'Digital', 'Stage & Audio'];

// Script elements: label, keyboard cycling, and on-page layout in inches
// (left indent, width) used for both the editor and the PDF export.
export const ELEMENTS = {
  scene:          { label: 'Scene Heading', short: 'Scene',  caps: true,  left: 1.5, width: 6.0, hint: 'INT. KITCHEN - NIGHT' },
  action:         { label: 'Action',        short: 'Action', caps: false, left: 1.5, width: 6.0, hint: 'What we SEE and HEAR, in present tense.' },
  character:      { label: 'Character',     short: 'Char',   caps: true,  left: 3.7, width: 3.3, hint: 'NAME (who speaks)' },
  parenthetical:  { label: 'Parenthetical', short: 'Paren',  caps: false, left: 3.1, width: 2.4, hint: '(quietly)' },
  dialogue:       { label: 'Dialogue',      short: 'Dial',   caps: false, left: 2.5, width: 3.5, hint: 'What they say.' },
  transition:     { label: 'Transition',    short: 'Trans',  caps: true,  left: 5.5, width: 2.0, hint: 'CUT TO:', align: 'right' },
  shot:           { label: 'Shot',          short: 'Shot',   caps: true,  left: 1.5, width: 6.0, hint: 'CLOSE ON — THE LETTER' },
  actBreak:       { label: 'Act Break',     short: 'Act',    caps: true,  left: 1.5, width: 6.0, hint: 'END OF ACT ONE', align: 'center', underline: true },
  coldOpen:       { label: 'Cold Open',     short: 'Cold',   caps: true,  left: 1.5, width: 6.0, hint: 'COLD OPEN', align: 'center', underline: true },
  actHeading:     { label: 'Act Heading',   short: 'Act',    caps: true,  left: 1.5, width: 6.0, hint: 'ACT ONE', align: 'center', underline: true },
  sceneHeading:   { label: 'Scene (Stage)', short: 'Scene',  caps: true,  left: 1.5, width: 6.0, hint: 'SCENE 1 — A cramped apartment. Evening.', align: 'center' },
  stageDirection: { label: 'Stage Direction', short: 'Dir',  caps: false, left: 3.0, width: 4.5, hint: '(She crosses to the window.)', italic: true },
  sound:          { label: 'Sound (SFX)',   short: 'SFX',    caps: true,  left: 1.5, width: 6.0, hint: 'SFX: RAIN ON A TIN ROOF' },
  music:          { label: 'Music',         short: 'Music',  caps: true,  left: 1.5, width: 6.0, hint: 'MUSIC: A LONELY PIANO, FADING IN' },
  narrator:       { label: 'Narrator',      short: 'Narr',   caps: false, left: 2.5, width: 3.5, hint: 'NARRATOR: Long ago...' },
};

// What element follows when you press Enter at the end of one.
export const NEXT_ON_ENTER = {
  scene: 'action',
  action: 'action',
  character: 'dialogue',
  parenthetical: 'dialogue',
  dialogue: 'character',
  transition: 'scene',
  shot: 'action',
  actBreak: 'scene',
  coldOpen: 'scene',
  actHeading: 'sceneHeading',
  sceneHeading: 'stageDirection',
  stageDirection: 'character',
  sound: 'character',
  music: 'character',
  narrator: 'sound',
};

// Tab cycles through the most common elements for each family.
export function tabCycle(format) {
  const f = FORMATS[format];
  if (format === 'stagePlay') return ['character', 'stageDirection', 'dialogue', 'parenthetical', 'sceneHeading', 'actHeading'];
  if (format === 'audioDrama') return ['character', 'sound', 'music', 'dialogue', 'parenthetical', 'narrator', 'scene'];
  const base = ['action', 'character', 'dialogue', 'parenthetical', 'scene', 'transition', 'shot'];
  return base.filter((e) => f.elements.includes(e));
}

export function defaultFirstElement(format) {
  if (format === 'stagePlay') return 'actHeading';
  if (['tvHalf', 'tvMulti', 'tvHour', 'animatedTV'].includes(format)) return 'coldOpen';
  return 'scene';
}
