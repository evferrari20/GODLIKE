import { useMemo, useState } from 'react';
import { LIBRARY, LIBRARY_CATEGORIES } from '../data/library';
import { FORMATS } from '../data/formats';
import { STRUCTURES } from '../data/structures';

export default function Library() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [tab, setTab] = useState('glossary');
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return LIBRARY.filter((e) => (cat === 'All' || e.cat === cat) && (!s || `${e.term} ${e.short} ${e.body}`.toLowerCase().includes(s)));
  }, [q, cat]);

  return (
    <div className="view pad">
      <div style={{ maxWidth: 900 }}>
        <h1>Craft Library</h1>
        <p className="muted">Everything a new screenwriter needs to know, explained in plain language with examples.</p>
        <div className="tabs">
          {[['glossary', 'Glossary'], ['formats', 'Formats'], ['structures', 'Story structures']].map(([k, l]) => (
            <button key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        {tab === 'glossary' && (
          <>
            <input className="input" placeholder="Search: slugline, subtext, midpoint…" value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="row wrap" style={{ margin: '12px 0 18px' }}>
              {['All', ...LIBRARY_CATEGORIES].map((c) => <button key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>{c}</button>)}
            </div>
            <div className="col">
              {list.map((e) => (
                <details key={e.term} className="card lib-entry">
                  <summary style={{ cursor: 'pointer', listStyle: 'none' }}>
                    <div className="row"><h3 style={{ margin: 0 }}>{e.term}</h3><div className="spacer" /><span className="tag">{e.cat}</span></div>
                    <div className="muted">{e.short}</div>
                  </summary>
                  <p style={{ marginBottom: 0 }}>{e.body}</p>
                  {e.example && <pre>{e.example}</pre>}
                </details>
              ))}
              {!list.length && <div className="empty">Nothing matches "{q}".</div>}
            </div>
          </>
        )}

        {tab === 'formats' && (
          <div className="col">
            {Object.values(FORMATS).map((f) => (
              <div key={f.id} className="card">
                <div className="row"><h3 style={{ margin: 0 }}>{f.name}</h3><div className="spacer" /><span className="tag blue">{f.pages[0]}–{f.pages[1]} pages</span><span className="tag">{f.runtime}</span></div>
                <p className="muted" style={{ marginBottom: 0 }}>{f.teach}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'structures' && (
          <div className="col">
            {Object.entries(STRUCTURES).map(([k, s]) => (
              <details key={k} className="card">
                <summary style={{ cursor: 'pointer' }}><b style={{ fontFamily: 'var(--font-display)', fontSize: 19 }}>{s.name}</b> <span className="faint small">· {s.beats.length} beats · {s.acts.join(' / ')}</span></summary>
                <div className="col" style={{ marginTop: 12 }}>
                  {s.beats.map((b, i) => (
                    <div key={b.id} className="row" style={{ alignItems: 'flex-start' }}>
                      <span className="tag" style={{ minWidth: 44, textAlign: 'center' }}>{Math.round(b.at * 100)}%</span>
                      <div><b>{i + 1}. {b.name}</b><div className="muted small">{b.why}</div></div>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
