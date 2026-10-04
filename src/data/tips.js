// Contextual teaching. These appear quietly beside whatever the writer is
// doing, so the lessons arrive when they're useful rather than as a course.

export const ELEMENT_TIPS = {
  scene: [
    'Start with INT. (inside) or EXT. (outside), then the location, then DAY or NIGHT.',
    'Keep location names identical every time. The production team builds a schedule from them.',
    'Type "i" then Tab or "e" then Tab at the start of a line for a quick INT./EXT.',
    'A new scene heading means a new place or time. If neither changes, it\'s the same scene.',
  ],
  action: [
    'Write only what we can SEE or HEAR, in the present tense.',
    'Keep action paragraphs to 3–4 lines. White space makes your script fast to read.',
    'CAPITALIZE a character\'s name the first time we meet them, plus their age: MARA (30s).',
    'Show, don\'t tell. "She is nervous" → "She clicks the pen. Clicks it. Clicks it."',
    'Strong verbs beat adverbs. "Walks quickly" → "hurries", "darts", "storms".',
  ],
  character: [
    'Type the character name in caps. Press Enter to go straight to dialogue.',
    'Add (V.O.) for voice-over or (O.S.) for off-screen.',
    'Start typing and GODLIKE will suggest names you\'ve already used.',
  ],
  parenthetical: [
    'Parentheticals are seasoning, not the meal. Use one only if the line could be misread.',
    'They can show who a line is addressed to: (to Sam).',
  ],
  dialogue: [
    'Real people rarely say exactly what they mean. Look for the subtext.',
    'Keep speeches short. A wall of dialogue is a red flag to readers.',
    'Read it out loud. If you trip over it, an actor will too.',
    'Cut the greetings and small talk. Enter the conversation late.',
  ],
  transition: [
    'Modern spec scripts use transitions sparingly. A new scene heading already implies a cut.',
    'SMASH CUT for shock or comedy. MATCH CUT to link two images.',
  ],
  shot: [
    'Spec scripts rarely call shots. Use one only when a detail is crucial to the story.',
  ],
  actBreak: ['Every act out should end on a question the viewer needs answered.'],
  coldOpen: ['Cold opens hook viewers before the titles. Make it something they can\'t look away from.'],
  actHeading: ['Most contemporary plays are one or two acts.'],
  sceneHeading: ['Stage scene headings often describe the setting briefly: "SCENE 2. The porch, later that night."'],
  stageDirection: ['Keep stage directions lean. Describe entrances, exits and essential action only.'],
  sound: ['In audio, sound is your camera. Layer two or three sounds to build a place.'],
  music: ['Music cues set emotion and mark transitions between scenes.'],
  narrator: ['Use narration lightly. Let dialogue and sound do most of the work.'],
};

export const WIZARD_STEPS = [
  {
    id: 'format',
    title: 'Choose your format',
    lesson: 'Format shapes everything: length, structure, and how you write each page. If this is your first script, a short film is the best way to learn. You can finish it in a weekend and see the whole shape of a story.',
  },
  {
    id: 'idea',
    title: 'Spark the idea',
    lesson: 'Most great stories start with a "What if…?" question. What if a shark terrorized a beach town on the Fourth of July? What if toys came alive when we left the room? Don\'t judge your idea yet. Just get it down.',
  },
  {
    id: 'genre',
    title: 'Genre & tone',
    lesson: 'Genre is a promise to your audience. A horror film promises fear, a comedy promises laughs. Tone is how you deliver it: dark comedy and broad comedy are both comedy, but they feel very different.',
  },
  {
    id: 'hero',
    title: 'Your main character',
    lesson: 'Stories are about people who want something badly and struggle to get it. The best protagonists have a clear want (external goal) and a hidden need (the inner change they must make).',
  },
  {
    id: 'logline',
    title: 'Write your logline',
    lesson: 'A logline is your whole story in one sentence. It\'s what you\'ll pitch and the compass you\'ll check against while writing. Formula: When [inciting incident], a [specific hero] must [goal] or else [stakes].',
  },
  {
    id: 'cast',
    title: 'Build the cast',
    lesson: 'Every supporting character should help or block the hero in some way, ideally both. The antagonist is the most important: they should be strong enough that we genuinely doubt the hero will win.',
  },
  {
    id: 'beats',
    title: 'Map the beats',
    lesson: 'Beats are the big turning points of your story. You don\'t need them all figured out. Answer what you can and leave the rest blank. GODLIKE will help fill the holes later.',
  },
  {
    id: 'finish',
    title: 'Ready to write',
    lesson: 'You now have more planning than many professional first drafts. Your beats become index cards on the Beat Board, your characters live in the Bible, and the script editor is ready. Remember: the first draft\'s only job is to exist.',
  },
];

export const GENRES = [
  'Drama', 'Comedy', 'Thriller', 'Horror', 'Sci-Fi', 'Fantasy', 'Action', 'Romance',
  'Mystery', 'Crime', 'Western', 'Musical', 'Family', 'Animation', 'Documentary-style',
  'Historical', 'War', 'Sports', 'Coming-of-Age', 'Satire', 'Dramedy', 'Psychological',
];

export const TONES = [
  'Dark & gritty', 'Light & playful', 'Heartfelt', 'Tense & suspenseful', 'Absurd',
  'Whimsical', 'Epic', 'Intimate', 'Satirical', 'Melancholy', 'Hopeful', 'Eerie',
];

// Offline scene-option banks, used by the Scene Assistant when no API key is
// set. Each is a list of short, concrete choices a beginner can pick from.
export const SCENE_BANK = {
  places: {
    any: ['a crowded diner at 3 a.m.', 'a stalled elevator', 'a hospital waiting room', 'a rooftop at dusk', 'a car parked outside someone\'s house', 'a laundromat', 'a funeral reception', 'a moving truck', 'a school gym after hours', 'a lake house in the off-season'],
    Horror: ['a basement with one working bulb', 'an empty summer camp in winter', 'a motel with too many keys', 'a baby monitor room'],
    Comedy: ['a kid\'s birthday party gone wrong', 'a wedding seating-chart meeting', 'a DMV line', 'an escape room'],
    'Sci-Fi': ['a decommissioned space station', 'a lab after a power failure', 'a colony greenhouse', 'a cryo bay waking up early'],
    Romance: ['a bookstore at closing', 'a delayed train platform', 'a friend\'s wedding', 'a rainy bus shelter'],
    Thriller: ['a parking garage', 'an interrogation room', 'a stranger\'s car', 'a server room'],
    Fantasy: ['a crumbling throne room', 'a market of forbidden things', 'a forest that moves at night', 'a dragon\'s abandoned nest'],
  },
  times: ['DAWN', 'MORNING', 'DAY', 'GOLDEN HOUR', 'DUSK', 'NIGHT', 'LATE NIGHT', 'CONTINUOUS', 'MOMENTS LATER', 'LATER'],
  conflicts: [
    'One character is hiding something the other is close to discovering.',
    'Both want the same thing and only one can have it.',
    'One wants to leave; the other needs them to stay.',
    'A secret is accidentally revealed by a third party.',
    'Someone must ask for help from the person they wronged.',
    'A deadline is minutes away and the plan just broke.',
    'One character is lying, and the audience knows it.',
    'An old wound gets reopened by an innocent remark.',
  ],
  openings: [
    'Open in the middle of an argument.',
    'Open on a small, telling detail, then pull back.',
    'Open on silence, then break it.',
    'Open on the aftermath. We figure out what happened.',
    'Open with a character doing something we don\'t understand yet.',
  ],
  endings: [
    'End on a decision.',
    'End on a reveal that reframes the scene.',
    'End on an interruption: someone walks in.',
    'End on an image that echoes an earlier scene.',
    'End a beat early, before anyone says the obvious thing.',
  ],
  questions: [
    'Who wants something in this scene, and what is it?',
    'What stands in their way, right here, right now?',
    'How is the situation different at the end than at the start?',
    'What does the audience know that a character doesn\'t?',
    'What is NOT being said?',
    'Could this scene happen somewhere more interesting?',
    'What is the last image or line? Does it pull us into the next scene?',
  ],
};
