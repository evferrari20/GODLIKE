import { lazy, Suspense, useEffect, useState } from 'react';
import { useProjects, useSettings, useActiveProject } from './store';
import { Toasts } from './components/ui';
import Home from './views/Home';
const Wizard = lazy(() => import('./views/Wizard'));
const ScriptEditor = lazy(() => import('./views/ScriptEditor'));
const BeatBoard = lazy(() => import('./views/BeatBoard'));
const Bible = lazy(() => import('./views/Bible'));
const DesignStudio = lazy(() => import('./views/DesignStudio'));
const Doctor = lazy(() => import('./views/Doctor'));
const Library = lazy(() => import('./views/Library'));
const Settings = lazy(() => import('./views/Settings'));
import ExportMenu from './components/ExportMenu';
import { FORMATS } from './data/formats';

const NAV = [
  { group: 'Develop', items: [
    { id: 'wizard', ico: '✦', label: 'Story Wizard' },
    { id: 'board', ico: '▤', label: 'Beat Board' },
    { id: 'bible', ico: '❖', label: 'Story Bible' },
    { id: 'design', ico: '✎', label: 'Design Studio' },
  ] },
  { group: 'Write', items: [
    { id: 'script', ico: '¶', label: 'Script' },
    { id: 'doctor', ico: '✚', label: 'Script Doctor' },
  ] },
];

function useHashView() {
  const read = () => (location.hash.replace(/^#\/?/, '') || 'home');
  const [view, setView] = useState(read);
  useEffect(() => {
    const on = () => setView(read());
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  return [view, (v) => { location.hash = '/' + v; }];
}

export default function App() {
  const [view, go] = useHashView();
  const project = useActiveProject();
  const update = useProjects((s) => s.update);
  const theme = useSettings((s) => s.theme);
  const [hydrated, setHydrated] = useState(useProjects.persist.hasHydrated());
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => useProjects.persist.onFinishHydration(() => setHydrated(true)), []);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);

  const needsProject = !['home', 'library', 'settings'].includes(view);
  const shown = needsProject && !project ? 'home' : view;

  if (!hydrated) return <div className="center" style={{ height: '100vh' }}><span className="spinner" /></div>;

  const page = {
    home: <Home go={go} />,
    wizard: <Wizard go={go} />,
    script: <ScriptEditor go={go} />,
    board: <BeatBoard go={go} />,
    bible: <Bible go={go} />,
    design: <DesignStudio go={go} />,
    doctor: <Doctor go={go} />,
    library: <Library />,
    settings: <Settings />,
  }[shown] || <Home go={go} />;

  return (
    <div className={`app ${collapsed ? 'collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="brand" onClick={() => setCollapsed((c) => !c)} title="Collapse sidebar">
          <div className="brand-mark">G</div>
          <div className="brand-name">GODLIKE</div>
        </div>
        <button className={`nav-item ${shown === 'home' ? 'active' : ''}`} onClick={() => go('home')}>
          <span className="ico">⌂</span><span>Projects</span>
        </button>
        {NAV.map((g) => (
          <div key={g.group}>
            <div className="nav-label">{g.group}</div>
            {g.items.map((it) => (
              <button key={it.id} disabled={!project} className={`nav-item ${shown === it.id ? 'active' : ''}`} onClick={() => go(it.id)} title={it.label}>
                <span className="ico">{it.ico}</span><span>{it.label}</span>
              </button>
            ))}
          </div>
        ))}
        <div className="nav-label">Learn</div>
        <button className={`nav-item ${shown === 'library' ? 'active' : ''}`} onClick={() => go('library')}>
          <span className="ico">❡</span><span>Craft Library</span>
        </button>
        <button className={`nav-item ${shown === 'settings' ? 'active' : ''}`} onClick={() => go('settings')}>
          <span className="ico">⚙</span><span>Settings</span>
        </button>
        <div className="sidebar-foot">Your work saves automatically in this browser.</div>
      </aside>

      <main className="main">
        {project && shown !== 'home' && shown !== 'library' && shown !== 'settings' ? (
          <div className="topbar">
            <input
              className="title-input"
              value={project.title}
              onChange={(e) => update({ title: e.target.value })}
              aria-label="Project title"
            />
            <span className="tag blue">{FORMATS[project.format]?.name}</span>
            <div className="spacer" />
            <ExportMenu project={project} />
          </div>
        ) : null}
        <div className="fill"><Suspense fallback={<div className="center" style={{ flex: 1 }}><span className="spinner" /></div>}>{page}</Suspense></div>
      </main>
      <Toasts />
    </div>
  );
}
