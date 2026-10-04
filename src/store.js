// App state. Projects (including drawings) persist to IndexedDB so large
// canvases don't hit localStorage limits; settings persist the same way.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import { FORMATS, defaultFirstElement } from './data/formats';

// Structured-clone storage straight into IndexedDB (no JSON round-trip), with
// writes debounced so typing never waits on serialization of big canvases.
const timers = {};
const idbStorage = {
  getItem: async (name) => (await get(name)) ?? null,
  setItem: (name, value) => {
    clearTimeout(timers[name]);
    timers[name] = setTimeout(() => set(name, value).catch((e) => console.error('save failed', e)), 350);
  },
  removeItem: async (name) => del(name),
};

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function blankProject(format = 'feature') {
  const now = Date.now();
  return {
    id: uid(),
    title: 'Untitled',
    author: '',
    contact: '',
    format,
    structure: FORMATS[format].structure,
    genres: [],
    tones: [],
    idea: '',
    logline: '',
    theme: '',
    beats: {},
    cards: [],
    characters: [],
    locations: [],
    worldNotes: '',
    designs: [],
    script: [{ id: uid(), type: defaultFirstElement(format), text: '' }],
    wizardStep: 0,
    wizardDone: false,
    createdAt: now,
    updatedAt: now,
  };
}

export const useProjects = create(
  persist(
    (setState, getState) => ({
      projects: {},
      activeId: null,

      createProject(format, extra = {}) {
        const p = { ...blankProject(format), ...extra };
        setState((s) => ({ projects: { ...s.projects, [p.id]: p }, activeId: p.id }));
        return p.id;
      },
      importProject(data) {
        const p = { ...blankProject(data.format || 'feature'), ...data, id: uid(), updatedAt: Date.now() };
        setState((s) => ({ projects: { ...s.projects, [p.id]: p }, activeId: p.id }));
        return p.id;
      },
      deleteProject(id) {
        setState((s) => {
          const projects = { ...s.projects };
          delete projects[id];
          return { projects, activeId: s.activeId === id ? null : s.activeId };
        });
      },
      duplicateProject(id) {
        const src = getState().projects[id];
        if (!src) return;
        const copy = { ...structuredClone(src), id: uid(), title: src.title + ' (copy)', updatedAt: Date.now() };
        setState((s) => ({ projects: { ...s.projects, [copy.id]: copy } }));
      },
      setActive(id) {
        setState({ activeId: id });
      },
      /** Shallow-merge a patch (or patch-producing fn) into the active project. */
      update(patch) {
        setState((s) => {
          const p = s.projects[s.activeId];
          if (!p) return {};
          const next = typeof patch === 'function' ? patch(p) : patch;
          return { projects: { ...s.projects, [p.id]: { ...p, ...next, updatedAt: Date.now() } } };
        });
      },
    }),
    { name: 'godlike-projects', storage: idbStorage, partialize: (s) => ({ projects: s.projects, activeId: s.activeId }) }
  )
);

export const useActiveProject = () => useProjects((s) => s.projects[s.activeId]);

export const useSettings = create(
  persist(
    (setState) => ({
      apiKey: '',
      model: 'claude-opus-5-5',
      assistLevel: 1, // 0 = ask me questions, 1 = suggest options, 2 = draft for me
      theme: 'dark',
      tips: true,
      imageProvider: 'pollinations', // 'pollinations' | 'openai' | 'none'
      openaiKey: '',
      set: (patch) => setState(patch),
    }),
    { name: 'godlike-settings', storage: idbStorage, partialize: ({ set: _omit, ...data }) => data }
  )
);

// Simple global toast for confirmations and errors.
export const useToast = create((setState) => ({
  toasts: [],
  push(msg, kind = 'info') {
    const id = uid();
    setState((s) => ({ toasts: [...s.toasts, { id, msg, kind }] }));
    setTimeout(() => setState((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4200);
  },
}));
export const toast = (msg, kind) => useToast.getState().push(msg, kind);
