import { useMemo, useState } from 'react';
import { useActiveProject, useProjects } from '../store';
import { runDoctor } from '../lib/doctor';
import { FORMATS } from '../data/formats';
import { Lesson, useBusy } from '../components/ui';
import { ask, hasAI, projectContext } from '../lib/ai';

const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    scores: {
      type: 'object',
      properties: { premise: { type: 'integer' }, structure: { type: 'integer' }, character: { type: 'integer' }, dialogue: { type: 'integer' }, pacing: { type: 'integer' } },
      required: ['premise', 'structure', 'character', 'dialogue', 'pacing'],
      additionalProperties: false,
    },
    strengths: { type: 'array', items: { type: 'string' } },
    holes: {
      type: 'array',
      items: {
        type: 'object',
        properties: { title: { type: 'string' }, detail: { type: 'string' }, fix: { type: 'string' }, severity: { type: 'string', enum: ['high', 'med', 'low'] } },
        required: ['title', 'detail', 'fix', 'severity'],
        additionalProperties: false,
      },
    },
    setupsWithoutPayoff: { type: 'array', items: { type: 'string' } },
    nextSteps: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'scores', 'strengths', 'holes', 'setupsWithoutPayoff', 'nextSteps'],
  additionalProperties: false,
};

export default function Doctor({ go }) {
  const project = useActiveProject();
  const update = useProjects((s) => s.update);
  const { notes, stats } = useMemo(() => runDoctor(project), [project]);
  const [busy, run] = useBusy();
  const [filter, setFilter] = useState('all');
  const review = project.aiReview;
  const fmt = FORMATS[project.format];

  const deepReview = () => run(async () => {
    const res = await ask({
      system: 'You are a professional script reader writing coverage for a beginner. Be honest but encouraging. Scores are 1-10. Find plot holes, logic gaps, motivation problems, missing setups and unpaid setups, and passive protagonist moments. Every hole needs a concrete, beginner-friendly fix.',
      content: projectContext(project, { includeScript: true }),
      schema: REVIEW_SCHEMA,
      maxTokens: 16000,
      effort: 'high',
    });
    update({ aiReview: { ...res, at: Date.now() } });
  });

  const shown = notes.filter((n) => filter === 'all' || n.area === filter);
  const areas = [...new Set(notes.map((n) => n.area))];

  return (
    <div className="view pad">
      <div style={{ maxWidth: 980 }}>
        <div className="row wrap">
          <h2 style={{ margin: 0 }}>Script Doctor</h2>
          <div className="spacer" />
          <button className="btn primary" disabled={busy || !hasAI()} onClick={deepReview}>{busy ? <><span className="spinner" /> Reading your script…</> : '✨ Full AI coverage'}</button>
        </div>
        <Lesson>
          Professional readers write "coverage": a report on premise, structure, character and dialogue. The quick checks below run instantly as you write.
          {hasAI() ? ' Full AI coverage reads your whole script and story bible to find plot holes and unpaid setups.' : ' Add a Claude key in Settings to unlock full AI coverage with plot-hole detection.'}
        </Lesson>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', margin: '18px 0' }}>
          <Stat k="Pages" v={stats.pages} sub={`target ${fmt.pages[0]}–${fmt.pages[1]}`} />
          <Stat k="Scenes" v={stats.scenes} />
          <Stat k="Speaking roles" v={stats.speakingCharacters} />
          <Stat k="Words" v={stats.words.toLocaleString()} />
          <Stat k="Dialogue" v={`${stats.dialoguePct}%`} sub="of the text" />
        </div>
        <div className="meter" title="Progress to minimum length"><div style={{ width: `${Math.min(100, (stats.pages / fmt.pages[0]) * 100)}%` }} /></div>

        {review && (
          <div className="card" style={{ marginTop: 22 }}>
            <div className="row"><h3 style={{ margin: 0 }}>Coverage</h3><div className="spacer" /><span className="faint small">{new Date(review.at).toLocaleString()}</span></div>
            <p>{review.summary}</p>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))' }}>
              {Object.entries(review.scores).map(([k, v]) => (
                <div key={k}>
                  <div className="row small"><span style={{ textTransform: 'capitalize' }}>{k}</span><div className="spacer" /><b>{v}/10</b></div>
                  <div className="meter"><div style={{ width: `${v * 10}%` }} /></div>
                </div>
              ))}
            </div>
            {review.strengths?.length > 0 && <><h3 style={{ marginTop: 18 }}>What's working</h3><ul className="muted">{review.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul></>}
            {review.holes?.length > 0 && (
              <>
                <h3 style={{ marginTop: 18 }}>Holes & problems</h3>
                <div className="col">
                  {review.holes.map((h, i) => (
                    <div key={i} className="note">
                      <div className={`sev ${h.severity}`} />
                      <div><b>{h.title}</b><div className="muted small">{h.detail}</div><div className="small" style={{ marginTop: 4 }}><span className="tag blue">Try</span> {h.fix}</div></div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {review.setupsWithoutPayoff?.length > 0 && <><h3 style={{ marginTop: 18 }}>Setups without payoffs</h3><ul className="muted">{review.setupsWithoutPayoff.map((s, i) => <li key={i}>{s}</li>)}</ul></>}
            {review.nextSteps?.length > 0 && <><h3 style={{ marginTop: 18 }}>Next steps</h3><ol className="muted">{review.nextSteps.map((s, i) => <li key={i}>{s}</li>)}</ol></>}
          </div>
        )}

        <div className="row wrap" style={{ margin: '24px 0 10px' }}>
          <h3 style={{ margin: 0 }}>Quick checks</h3>
          <div className="spacer" />
          <button className={`chip ${filter === 'all' ? 'on' : ''}`} onClick={() => setFilter('all')}>All ({notes.length})</button>
          {areas.map((a) => <button key={a} className={`chip ${filter === a ? 'on' : ''}`} onClick={() => setFilter(a)}>{a}</button>)}
        </div>
        <div className="col">
          {shown.map((n, i) => (
            <div key={i} className="note">
              <div className={`sev ${n.severity}`} />
              <div className="grow">
                <div className="row"><b>{n.title}</b><span className="tag">{n.area}</span></div>
                <div className="muted small">{n.detail}</div>
              </div>
              {n.blockId && <button className="btn xs" onClick={() => go('script')}>Go to script</button>}
              {n.area === 'Structure' && <button className="btn xs" onClick={() => go('board')}>Beat Board</button>}
              {n.area === 'Character' && !n.blockId && <button className="btn xs" onClick={() => go('bible')}>Bible</button>}
            </div>
          ))}
          {!shown.length && <div className="empty">No issues found. Nice work!</div>}
        </div>
      </div>
    </div>
  );
}

function Stat({ k, v, sub }) {
  return <div className="stat"><div className="v">{v}</div><div className="k">{k}</div>{sub && <div className="faint small">{sub}</div>}</div>;
}
