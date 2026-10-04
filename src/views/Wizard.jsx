import { useMemo, useState } from 'react';
import { useActiveProject, useProjects, uid, toast } from '../store';
import { WIZARD_STEPS, GENRES, TONES } from '../data/tips';
import { FORMATS } from '../data/formats';
import { STRUCTURES } from '../data/structures';
import { FormatPicker } from './Home';
import { Lesson, Field, Chips, Tip } from '../components/ui';
import HelpMe from '../components/HelpMe';
import LongHint from '../components/LongHint';

const SPARKS = {
  who: ['a retired stuntwoman', 'a night-shift janitor', 'a disgraced chef', 'twin sisters who swapped lives', 'a lonely lighthouse keeper', 'a teenage hacker', 'a small-town mayor', 'a ghost who doesn\'t know it', 'a wedding DJ', 'an aging rock star'],
  what: ['finds a door that wasn\'t there yesterday', 'inherits a debt to the wrong people', 'is mistaken for someone famous', 'must keep a secret for one night', 'gets one last chance to win back their family', 'wakes up with a stranger\'s memories', 'has to deliver a package across a hostile city', 'discovers their town is being sold'],
  twist: ['but they can\'t tell anyone why', 'during the worst storm in a century', 'with the one person they swore never to speak to again', 'and every choice makes things worse', 'before the sun comes up', 'while pretending everything is fine'],
};
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export const ROLES = ['Protagonist', 'Antagonist', 'Love Interest', 'Mentor', 'Ally', 'Foil', 'Supporting', 'Minor'];

export default function Wizard({ go }) {
  const project = useActiveProject();
  const update = useProjects((s) => s.update);
  const step = project.wizardStep || 0;
  const setStep = (n) => update({ wizardStep: Math.max(0, Math.min(WIZARD_STEPS.length - 1, n)) });
  const S = WIZARD_STEPS[step];

  return (
    <div className="view pad">
      <div className="wizard">
        <div className="steps">
          {WIZARD_STEPS.map((s, i) => (
            <div key={s.id} className={`step-dot ${i < step ? 'done' : ''} ${i === step ? 'current' : ''}`} onClick={() => setStep(i)} title={s.title}>
              <span>{i + 1}. {s.title}</span>
            </div>
          ))}
        </div>
        <div className="wizard-body">
          <div className="eyebrow">Step {step + 1} of {WIZARD_STEPS.length}</div>
          <h1>{S.title}</h1>
          <Lesson>{S.lesson}</Lesson>
          <div style={{ marginTop: 22 }}>
            {S.id === 'format' && <StepFormat project={project} update={update} />}
            {S.id === 'idea' && <StepIdea project={project} update={update} />}
            {S.id === 'genre' && <StepGenre project={project} update={update} />}
            {S.id === 'hero' && <StepHero project={project} update={update} />}
            {S.id === 'logline' && <StepLogline project={project} update={update} />}
            {S.id === 'cast' && <StepCast project={project} update={update} />}
            {S.id === 'beats' && <StepBeats project={project} update={update} />}
            {S.id === 'finish' && <StepFinish project={project} update={update} go={go} />}
          </div>
          <div className="row" style={{ marginTop: 30 }}>
            <button className="btn" disabled={step === 0} onClick={() => setStep(step - 1)}>← Back</button>
            <div className="spacer" />
            <button className="btn ghost" onClick={() => { update({ wizardDone: true }); go('script'); }}>Skip to writing</button>
            {step < WIZARD_STEPS.length - 1 && <button className="btn primary" onClick={() => setStep(step + 1)}>Continue →</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepFormat({ project, update }) {
  const fmt = FORMATS[project.format];
  return (
    <div className="col" style={{ gap: 20 }}>
      <FormatPicker value={project.format} onPick={(f) => update({ format: f, structure: FORMATS[f].structure })} />
      <Lesson><b>{fmt.name}:</b> {fmt.teach}</Lesson>
      <Field label="Story structure" help="The beat template GODLIKE uses on your Beat Board. You can switch any time.">
        <select className="select" value={project.structure} onChange={(e) => update({ structure: e.target.value })}>
          {Object.entries(STRUCTURES).map(([k, s]) => <option key={k} value={k}>{s.name}</option>)}
        </select>
      </Field>
    </div>
  );
}

function StepIdea({ project, update }) {
  const [spark, setSpark] = useState('');
  return (
    <div className="col" style={{ gap: 16 }}>
      <Field label="Working title">
        <input className="input" value={project.title} onChange={(e) => update({ title: e.target.value })} />
      </Field>
      <Field label="What's your idea?" help="Messy is fine. A situation, a character, an image, a feeling. Start with 'What if…'">
        <textarea className="textarea" rows={5} value={project.idea} onChange={(e) => update({ idea: e.target.value })} placeholder="What if a lighthouse keeper caught something in her net that the whole town wanted dead?" />
      </Field>
      <div className="card inset">
        <div className="row"><b>Stuck? Spin a spark.</b><div className="spacer" />
          <button className="btn sm" onClick={() => setSpark(`What if ${pick(SPARKS.who)} ${pick(SPARKS.what)} ${pick(SPARKS.twist)}?`)}>🎲 Spin</button>
        </div>
        {spark && (
          <div className="row" style={{ marginTop: 10 }}>
            <div className="grow" style={{ fontFamily: 'var(--font-display)', fontSize: 19 }}>{spark}</div>
            <button className="btn sm" onClick={() => update({ idea: (project.idea ? project.idea + '\n' : '') + spark })}>Use it</button>
          </div>
        )}
      </div>
      <HelpMe
        project={project}
        task={`Brainstorm "What if…?" story ideas${project.idea ? ' that build on or sharpen the writer\'s idea' : ''} for a ${FORMATS[project.format].name}.`}
        onPick={(t) => update({ idea: t })}
        label="Brainstorm with me"
        offline={['What do you love watching that nobody makes enough of?', 'What is something that happened to you that you still think about?', 'What job, place or world do you know that most people don\'t?', 'What scares you? What makes you laugh?']}
      />
    </div>
  );
}

function StepGenre({ project, update }) {
  return (
    <div className="col" style={{ gap: 18 }}>
      <Field label="Genre (pick one or two)"><Chips options={GENRES} value={project.genres} onChange={(v) => update({ genres: v })} /></Field>
      {project.genres.length > 2 && <Tip>You've picked {project.genres.length} genres. Most stories lead with one or two; the rest can show up as flavour. Which one is the main promise to your audience? (Western horror, for example, leads with horror.)</Tip>}
      <Field label="Tone"><Chips options={TONES} value={project.tones} onChange={(v) => update({ tones: v })} /></Field>
      <Field label="Theme: what is your story really about?" help="A theme is an idea about life, like 'You can't outrun your past' or 'Love means letting go.' Many writers only discover it while writing, and that's fine.">
        <input className="input" value={project.theme} onChange={(e) => update({ theme: e.target.value })} placeholder="Real courage is asking for help." />
      </Field>
      <HelpMe project={project} task="Suggest possible themes (a one-line statement about life) that this idea could explore." onPick={(t) => update({ theme: t })} label="Suggest themes"
        offline={[{ title: 'Connection', text: 'We can\'t heal alone.' }, { title: 'Identity', text: 'You become who you pretend to be.' }, { title: 'Sacrifice', text: 'Love means letting go.' }, { title: 'Truth', text: 'The lies that protect us also trap us.' }]} />
    </div>
  );
}

export function useProtagonist(project, update) {
  const lead = project.characters.find((c) => c.role === 'Protagonist');
  const set = (patch) => {
    if (lead) update({ characters: project.characters.map((c) => (c.id === lead.id ? { ...c, ...patch } : c)) });
    else update({ characters: [...project.characters, newCharacter({ role: 'Protagonist', ...patch })] });
  };
  return [lead || newCharacter({ role: 'Protagonist' }), set];
}

export function newCharacter(extra = {}) {
  return { id: uid(), name: '', role: 'Supporting', age: '', logline: '', want: '', need: '', wound: '', flaw: '', arc: '', voice: '', look: '', wardrobe: '', notes: '', relationships: [], portrait: '', ...extra };
}

function StepHero({ project, update }) {
  const [hero, setHero] = useProtagonist(project, update);
  const field = (k, label, help, ph, rows = 2) => (
    <Field label={label} help={help}>
      <textarea className="textarea" rows={rows} value={hero[k]} onChange={(e) => setHero({ [k]: e.target.value })} placeholder={ph} />
      <LongHint field={k} text={hero[k]} />
    </Field>
  );
  return (
    <div className="col" style={{ gap: 16 }}>
      <div className="grid c2">
        <Field label="Name"><input className="input" value={hero.name} onChange={(e) => setHero({ name: e.target.value })} placeholder="Mara Quill" /></Field>
        <Field label="Age"><input className="input" value={hero.age} onChange={(e) => setHero({ age: e.target.value })} placeholder="34" /></Field>
      </div>
      {field('want', 'What do they WANT?', 'The external goal: something we could photograph them achieving.', 'To keep the lighthouse from being decommissioned.')}
      <HelpMe project={project} task="Suggest a concrete external WANT for the protagonist." onPick={(t) => setHero({ want: t })} label="Ideas for their want" />
      {field('need', 'What do they NEED (but don\'t know yet)?', 'The inner change. Usually the opposite of their flaw.', 'To let people back into her life.')}
      <HelpMe project={project} task="Suggest an inner NEED for the protagonist that contrasts with their want." onPick={(t) => setHero({ need: t })} label="Ideas for their need" />
      {field('wound', 'What happened to them? (the wound)', 'A past hurt that shaped them. It doesn\'t have to be tragic, just formative.', 'Her brother drowned on her watch twenty years ago.')}
      {field('flaw', 'What is their flaw?', 'The behaviour the wound created. This is what gets in their way.', 'She pushes everyone away before they can leave.')}
      <Tip>The best protagonists are <b>active</b>: they make choices that cause things to happen. If your hero mostly reacts, give them a goal they chase.</Tip>
    </div>
  );
}

function StepLogline({ project, update }) {
  const [hero] = useProtagonist(project, update);
  const [parts, setParts] = useState({ incident: '', who: hero.name || '', goal: hero.want || '', stakes: '' });
  const built = useMemo(() => {
    const { incident, who, goal, stakes } = parts;
    if (!incident && !who && !goal) return '';
    return `When ${incident || '[inciting incident]'}, ${who || '[a specific hero]'} must ${goal || '[goal]'}${stakes ? ` or ${stakes}` : ' or [stakes]'}.`;
  }, [parts]);
  const setPart = (k) => (e) => setParts((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="col" style={{ gap: 16 }}>
      <div className="card inset col">
        <b>Logline builder</b>
        <div className="grid c2">
          <Field label="When… (inciting incident)"><input className="input" value={parts.incident} onChange={setPart('incident')} placeholder="a storm washes a strange creature into her nets" /></Field>
          <Field label="a… (specific hero)" help="Describe them with a flaw or irony, not just a name."><input className="input" value={parts.who} onChange={setPart('who')} placeholder="a reclusive lighthouse keeper" /></Field>
          <Field label="must… (goal)"><input className="input" value={parts.goal} onChange={setPart('goal')} placeholder="hide it from a town that wants it dead" /></Field>
          <Field label="or… (stakes)"><input className="input" value={parts.stakes} onChange={setPart('stakes')} placeholder="lose the only friend she's made in twenty years" /></Field>
        </div>
        {built && (
          <div className="row">
            <div className="grow" style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>{built}</div>
            <button className="btn sm primary" onClick={() => update({ logline: built })}>Use this</button>
          </div>
        )}
      </div>
      <Field label="Your logline" help="One sentence, ideally under 35 words.">
        <textarea className="textarea" rows={3} value={project.logline} onChange={(e) => update({ logline: e.target.value })} />
      </Field>
      <div className="faint small">{project.logline.trim() ? project.logline.trim().split(/\s+/).length : 0} words</div>
      <HelpMe project={project} task="Write logline variations: specific hero, inciting incident, clear goal, opposition and stakes, with irony if possible. Under 35 words each." onPick={(t) => update({ logline: t })} label="Suggest loglines"
        offline={['Is your hero specific? "A cop" is generic; "a cop afraid of heights" has a story built in.', 'Is there a clear goal we could picture them achieving?', 'What happens if they fail? Make it personal.']} />
    </div>
  );
}

function StepCast({ project, update }) {
  const chars = project.characters;
  const setChar = (id, patch) => update({ characters: chars.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  const add = (extra) => update({ characters: [...chars, newCharacter(extra)] });
  return (
    <div className="col" style={{ gap: 14 }}>
      <Tip>Each character should either help or hinder your hero, ideally both at different times. Think about who <b>challenges the hero's flaw</b>.</Tip>
      {chars.map((c) => (
        <div key={c.id} className="card row wrap" style={{ padding: 12 }}>
          <input className="input" style={{ width: 180 }} value={c.name} onChange={(e) => setChar(c.id, { name: e.target.value })} placeholder="Name" />
          <select className="select" style={{ width: 150 }} value={c.role} onChange={(e) => setChar(c.id, { role: e.target.value })}>
            {ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
          <input className="input grow" value={c.logline} onChange={(e) => setChar(c.id, { logline: e.target.value })} placeholder="Who are they, in one line? What do they want from the hero?" />
          <button className="btn icon ghost danger" onClick={() => update({ characters: chars.filter((x) => x.id !== c.id) })}>✕</button>
        </div>
      ))}
      <div className="row wrap">
        {['Antagonist', 'Mentor', 'Ally', 'Love Interest', 'Foil'].map((r) => (
          <button key={r} className="btn sm" onClick={() => add({ role: r })}>+ {r}</button>
        ))}
      </div>
      <HelpMe project={project} task="Suggest supporting characters (name, role and one line about what they want from or against the protagonist) that would pressure the hero's flaw." label="Suggest a cast"
        onPick={(t) => { const m = t.match(/^([A-Z][\w'.-]*(?: [A-Z][\w'.-]*)?)/); add({ name: m ? m[1] : '', logline: t }); toast('Added to your cast. Edit freely.', 'ok'); }}
        offline={[
          { title: 'Antagonist', text: 'Someone who wants the opposite of your hero, and believes they are right.' },
          { title: 'Mentor', text: 'Someone who has walked this road and can teach the hero what they need (but not what they want).' },
          { title: 'Foil', text: 'A character who has the hero\'s flaw in reverse, highlighting what the hero lacks.' },
        ]} />
    </div>
  );
}

function StepBeats({ project, update }) {
  const structure = STRUCTURES[project.structure];
  const setBeat = (id, v) => update({ beats: { ...project.beats, [id]: v } });
  return (
    <div className="col" style={{ gap: 18 }}>
      <Tip>Answer what you know and skip the rest. Empty beats show up as holes on your Beat Board, and the assistant can help fill them later.</Tip>
      {structure.beats.map((b, i) => (
        <div key={b.id} className="card col" style={{ gap: 8 }}>
          <div className="row">
            <span className="tag">{structure.acts[b.act]}</span>
            <h3 style={{ margin: 0 }}>{i + 1}. {b.name}</h3>
            <div className="spacer" />
            <span className="faint small">~{Math.round(b.at * 100)}% in</span>
          </div>
          <div className="muted">{b.ask}</div>
          <textarea className="textarea" rows={2} value={project.beats[b.id] || ''} onChange={(e) => setBeat(b.id, e.target.value)} />
          <div className="why">Why it matters: {b.why}</div>
          <HelpMe project={project} task={`Suggest what happens at the "${b.name}" beat. Guidance: ${b.ask}`} onPick={(t) => setBeat(b.id, t)} label="Ideas for this beat" />
        </div>
      ))}
    </div>
  );
}

function StepFinish({ project, update, go }) {
  const structure = STRUCTURES[project.structure];
  const filled = structure.beats.filter((b) => project.beats[b.id]?.trim());
  const finish = (dest) => {
    const existing = new Set(project.cards.map((c) => c.beatId));
    const cards = [
      ...project.cards,
      ...filled.filter((b) => !existing.has(b.id)).map((b) => ({ id: uid(), act: b.act, title: b.name, text: project.beats[b.id], beatId: b.id, color: '#c99a68' })),
    ];
    update({ cards, wizardDone: true });
    go(dest);
  };
  return (
    <div className="col" style={{ gap: 16 }}>
      <div className="card">
        <div className="eyebrow">Your story</div>
        <h2>{project.title}</h2>
        {project.logline && <p style={{ fontFamily: 'var(--font-display)', fontSize: 19 }}>{project.logline}</p>}
        <div className="row wrap small muted">
          <span>{FORMATS[project.format].name}</span>·<span>{project.genres.join(', ') || 'No genre'}</span>·
          <span>{project.characters.length} characters</span>·<span>{filled.length}/{structure.beats.length} beats</span>
        </div>
      </div>
      <Lesson>
        <b>Next:</b> your beats become index cards on the Beat Board. Break each one into scenes, then write.
        Professional writers spend as much time outlining as drafting, but don't let planning become procrastination.
      </Lesson>
      <div className="row wrap">
        <button className="btn" onClick={() => finish('board')}>▤ Open the Beat Board</button>
        <button className="btn" onClick={() => finish('bible')}>❖ Flesh out characters</button>
        <button className="btn primary" onClick={() => finish('script')}>¶ Start writing →</button>
      </div>
    </div>
  );
}
