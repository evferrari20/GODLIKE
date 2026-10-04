// The reference library: a searchable craft glossary. Each entry has a short
// definition, a fuller explanation and, where it helps, a formatted example.

export const LIBRARY = [
  // ---------- Format ----------
  { cat: 'Format', term: 'Slugline (Scene Heading)', short: 'The line that starts every scene: INT. or EXT., location, time of day.', body: 'Sluglines tell the production team where and when a scene happens, so they can schedule the shoot. INT. means interior, EXT. means exterior. Keep locations consistent: if you call it "JOE\'S APARTMENT" once, never call it "JOE\'S FLAT" later. Times are usually DAY or NIGHT. Use CONTINUOUS when one scene flows directly into the next.', example: 'INT. LIGHTHOUSE - NIGHT\nEXT. HARBOR DOCKS - CONTINUOUS' },
  { cat: 'Format', term: 'Action Lines', short: 'Present-tense description of what we see and hear.', body: 'Write only what the camera can photograph or the microphone record. Keep paragraphs to 3–4 lines; white space makes a script fast to read. CAPITALIZE a character\'s name the first time they appear, along with key sounds and props.', example: 'MARA (30s, salt-cracked hands) hauls a net onto the deck. Something inside it MOVES.' },
  { cat: 'Format', term: 'Character Cue', short: 'The speaking character\'s name in caps, above their dialogue.', body: 'Use the same name every time. Add extensions in parentheses: (V.O.) for voice-over, (O.S.) for off-screen, (CONT\'D) when a character keeps talking after an action line.', example: 'MARA (O.S.)\nDon\'t touch that!' },
  { cat: 'Format', term: 'Parenthetical', short: 'A brief direction under a character name: (whispering), (to Sam).', body: 'Use them sparingly, only when the line would be misread without one or to show who is being addressed. Actors and directors dislike scripts that dictate every line reading.', example: 'SAM\n(barely audible)\nIt\'s still breathing.' },
  { cat: 'Format', term: 'Transition', short: 'How one scene moves to the next: CUT TO:, DISSOLVE TO:, SMASH CUT TO:.', body: 'Modern scripts use transitions rarely, because a new scene heading already implies a cut. Save them for meaningful effects: a SMASH CUT for comic or shock contrast, a MATCH CUT to link two images.', example: 'SMASH CUT TO:' },
  { cat: 'Format', term: 'V.O. vs O.S.', short: 'Voice-over (not in the scene) vs off-screen (in the scene, out of frame).', body: 'V.O. is narration, a phone voice or inner thoughts: the speaker is not physically present. O.S. means the speaker is there, just not on camera (in the next room, behind the door).' },
  { cat: 'Format', term: 'Montage', short: 'A series of short shots that compress time.', body: 'Head it with "MONTAGE — TITLE" and list each image as a short line, then end with "END MONTAGE". Training montages, falling-in-love montages and research montages are classics.', example: 'MONTAGE — MARA LEARNS THE SEA\n— Mara ties knots, fails, ties again.\n— A storm. She holds the wheel.\nEND MONTAGE' },
  { cat: 'Format', term: 'Intercut', short: 'Cutting back and forth between two places, typically for phone calls.', body: 'Establish both locations with sluglines, then write "INTERCUT — MARA / SAM" and let the dialogue run without re-heading each cut.' },
  { cat: 'Format', term: 'Title Page', short: 'Title, "Written by", your name and contact info. Nothing else.', body: 'No images, no dates, no WGA registration numbers, no "Draft 7". Title centered about a third down the page; contact info bottom left.' },
  { cat: 'Format', term: 'Page = Minute', short: 'One formatted page roughly equals one minute on screen.', body: 'This is why screenplay formatting is so strict: it lets producers estimate running time and budget from page count. Action-heavy pages run long; quick dialogue pages run short. It averages out.' },
  { cat: 'Format', term: 'Spec Script vs Shooting Script', short: 'A spec is a sales/sample script; a shooting script adds scene numbers and camera detail.', body: 'As a new writer you are writing a spec. Leave out scene numbers, CUT TOs on every scene, and most camera angles. Let the director direct.' },

  // ---------- Structure ----------
  { cat: 'Structure', term: 'Logline', short: 'One sentence that sells your story: protagonist + goal + obstacle + stakes.', body: 'A strong logline names a specific (not generic) hero, an inciting incident, a clear goal, a formidable opposition and what happens if they fail. Irony helps: "A cop who is afraid of heights must…"', example: 'When a reclusive lighthouse keeper nets a creature that the whole town wants dead, she must hide it through a hurricane or lose the only friend she\'s made in twenty years.' },
  { cat: 'Structure', term: 'Inciting Incident', short: 'The event that kicks off the story and disrupts the hero\'s normal life.', body: 'It happens TO the hero. Usually 10–15% into the story. Without it, you have a situation, not a story.' },
  { cat: 'Structure', term: 'Midpoint', short: 'The halfway turn, a false victory or false defeat that raises the stakes.', body: 'At the midpoint the hero often moves from reacting to acting. A ticking clock might start, a secret might come out, or the love story might peak.' },
  { cat: 'Structure', term: 'All Is Lost', short: 'The hero\'s lowest point, about 75% in.', body: 'Something or someone dies, literally or symbolically. The plan has failed. It sets up the final push.' },
  { cat: 'Structure', term: 'Climax', short: 'The final confrontation where the central question is answered.', body: 'The hero must drive the climax through their own choices. Rescue by luck or by someone else ("deus ex machina") feels unearned.' },
  { cat: 'Structure', term: 'A / B / C Stories', short: 'The main plot (A), secondary plot (B), and minor threads (C).', body: 'In film, the B story is usually the relationship that teaches the theme. In TV, A/B/C stories often follow different characters and braid together at the end.' },
  { cat: 'Structure', term: 'Act Break / Act Out', short: 'The turn that ends an act, especially before a TV commercial.', body: 'In TV every act should end on a question, reveal or reversal strong enough that the audience can\'t change the channel.' },
  { cat: 'Structure', term: 'Cold Open / Teaser', short: 'A scene before the opening titles.', body: 'In comedy it\'s often a standalone bit. In drama it\'s a hook: a crime, a mystery, a crisis. It promises what the episode will deliver.' },
  { cat: 'Structure', term: 'Setup & Payoff', short: 'Plant something early so it can matter later.', body: 'Chekhov\'s gun: if a gun is on the wall in act one, it must go off by act three. Every payoff needs a setup (or it feels like a cheat) and every setup needs a payoff (or it\'s clutter).' },
  { cat: 'Structure', term: 'Ticking Clock', short: 'A deadline that creates urgency.', body: 'A bomb, a wedding, a storm making landfall. Clocks turn "will they?" into "will they in time?"' },
  { cat: 'Structure', term: 'Stakes', short: 'What the hero stands to lose.', body: 'Stakes should be personal before they are global. We care about the world ending because the hero\'s daughter lives in it.' },

  // ---------- Character ----------
  { cat: 'Character', term: 'Want vs Need', short: 'What the character pursues vs what they actually require to be whole.', body: 'The want is external and drives the plot (win the trophy). The need is internal and drives the theme (learn to trust a team). Great endings often have the hero give up the want to gain the need.' },
  { cat: 'Character', term: 'Character Arc', short: 'How a character changes from beginning to end.', body: 'Positive arc: they overcome a flaw. Negative arc: they succumb to it. Flat arc: they stay true and change the world around them instead.' },
  { cat: 'Character', term: 'Flaw / Wound / Lie', short: 'The past hurt that created the false belief that holds the hero back.', body: 'Wound: something that happened ("my father left"). Lie: what they believe because of it ("anyone I love will leave"). Flaw: the behaviour it produces ("I push people away first").' },
  { cat: 'Character', term: 'Active Protagonist', short: 'A hero who makes choices that drive the story.', body: 'The number one note on beginner scripts: "Your protagonist is passive." Make sure your hero chooses, pursues and causes things, rather than just reacting to them.' },
  { cat: 'Character', term: 'Antagonist', short: 'The force opposing the hero, ideally embodying the opposite of the theme.', body: 'The best villains believe they are the heroes of their own story. They should be at least as competent as your protagonist.' },
  { cat: 'Character', term: 'Character Introduction', short: 'The first description of a character in the script.', body: 'Name in CAPS, age in parentheses, then one vivid, specific detail that reveals who they are, not just what they look like.', example: 'DESMOND (60s) irons his tie on the hood of his car. Twice.' },
  { cat: 'Character', term: 'Save the Cat Moment', short: 'An early action that makes us like the hero.', body: 'Named for a hero who saves a cat. Even prickly protagonists need a moment that earns our sympathy or admiration: kindness, skill, wit, or simply being wronged.' },

  // ---------- Dialogue ----------
  { cat: 'Dialogue', term: 'Subtext', short: 'What characters mean but don\'t say.', body: 'Real people rarely say exactly what they feel. "Did you eat?" can mean "I love you." Let the audience read between the lines.' },
  { cat: 'Dialogue', term: 'On-the-Nose Dialogue', short: 'Characters stating their feelings or the plot too directly.', body: '"I\'m angry because you betrayed me, my brother" is on the nose. Look for lines where characters explain things to someone who already knows them ("As you know, Bob…").' },
  { cat: 'Dialogue', term: 'Exposition', short: 'Information the audience needs to follow the story.', body: 'Hide it in conflict. People argue about facts; they don\'t recite them. Give out only what the audience needs, when they need it.' },
  { cat: 'Dialogue', term: 'Voice', short: 'How each character uniquely speaks.', body: 'Test: cover the character names. Can you still tell who is speaking? Vary vocabulary, sentence length, rhythm and what each one avoids saying.' },

  // ---------- Scene Craft ----------
  { cat: 'Scene Craft', term: 'Enter Late, Leave Early', short: 'Start a scene as late as possible and end it as soon as it turns.', body: 'Skip the hellos and goodbyes. Join the argument already underway. Cut as soon as the point lands.' },
  { cat: 'Scene Craft', term: 'Scene Goal', short: 'Every scene needs someone who wants something in it.', body: 'Ask of each scene: who wants what, what\'s in the way, and how is the situation different at the end? If nothing changes, cut it or combine it.' },
  { cat: 'Scene Craft', term: 'Value Shift', short: 'Each scene should flip a value: hope to despair, safe to danger.', body: 'From Robert McKee\'s Story. Mark each scene with a + or − at the start and end. If they match, the scene probably isn\'t turning.' },
  { cat: 'Scene Craft', term: 'Show, Don\'t Tell', short: 'Reveal through action and image rather than explanation.', body: 'Don\'t write "She is sad." Write what we SEE that makes us feel it: "She sets two plates. Stops. Puts one back."' },
  { cat: 'Scene Craft', term: 'Set Piece', short: 'A big, memorable sequence: a chase, a heist, a showstopper.', body: 'Set pieces are the moments that end up in the trailer. Fun and Games is where most of them live.' },

  // ---------- Camera ----------
  { cat: 'Camera & Shots', term: 'CLOSE ON / ANGLE ON', short: 'Directing attention to a specific detail.', body: 'Use sparingly in a spec script. A better trick is to imply the shot through a short, isolated action line: "The ring. Still on her finger."' },
  { cat: 'Camera & Shots', term: 'POV', short: 'Point of view: we see through a character\'s eyes.', example: 'MARA\'S POV — the water ripples. Something circles below.', body: 'Useful for horror, mystery and discovery moments.' },
  { cat: 'Camera & Shots', term: 'INSERT', short: 'A close shot of an object: a note, a phone screen, a clock.', body: 'Often used for text we must read. Follow it with BACK TO SCENE.' },
  { cat: 'Camera & Shots', term: 'Establishing Shot', short: 'A wide shot that sets the location.', body: 'Often written as EXT. CITY - NIGHT (ESTABLISHING) or simply implied by the slugline.' },

  // ---------- Stage ----------
  { cat: 'Stage', term: 'Stage Directions', short: 'Italicized, parenthetical notes on movement and setting.', body: 'Keep them minimal. Directors and actors find the blocking. Describe entrances, exits and essential business only.' },
  { cat: 'Stage', term: 'Upstage / Downstage', short: 'Upstage is away from the audience; downstage is toward it.', body: 'Stage left and right are from the ACTOR\'S perspective facing the audience.' },
  { cat: 'Stage', term: 'Blackout', short: 'All lights out at once, often ending a scene.', body: 'Plays use lights the way films use cuts: BLACKOUT, LIGHTS FADE, LIGHTS UP.' },

  // ---------- Audio ----------
  { cat: 'Audio', term: 'SFX Cue', short: 'A sound effect, written in caps.', body: 'In audio drama sounds do the job of sluglines. A gull and creaking rope says "harbor" faster than any narration.', example: 'SFX: GULLS. ROPES CREAK. A BELL BUOY CLANGS.' },
  { cat: 'Audio', term: 'Perspective (on/off mic)', short: 'How close a voice sounds tells the listener where people are.', body: 'Use (off mic), (distant) or (approaching) in parentheticals to place voices in space.' },
  { cat: 'Audio', term: 'Signposting', short: 'Naming characters and places in dialogue so listeners can follow.', body: '"Mara, put the lantern down" does double duty: it tells us who is there and what she\'s holding.' },

  // ---------- Industry ----------
  { cat: 'Industry', term: 'Treatment', short: 'A prose summary of your story, 2–20 pages.', body: 'Written in present tense like a short story. Used to pitch or plan before writing the script.' },
  { cat: 'Industry', term: 'Series Bible', short: 'A document describing a TV show\'s world, characters and future seasons.', body: 'Includes the premise, characters, tone, pilot summary and episode ideas. GODLIKE\'s Bible tab builds one as you go.' },
  { cat: 'Industry', term: 'Coverage', short: 'A reader\'s report summarizing and grading a script.', body: 'Readers grade premise, structure, character, dialogue and marketability, then give a Pass, Consider or Recommend. GODLIKE\'s Script Doctor uses similar categories.' },
  { cat: 'Industry', term: 'Pilot', short: 'The first episode of a TV series.', body: 'A pilot must tell a satisfying story AND show the engine of the series: why this show can produce 100 episodes.' },
];

export const LIBRARY_CATEGORIES = [...new Set(LIBRARY.map((e) => e.cat))];
