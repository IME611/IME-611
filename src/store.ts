import { useSyncExternalStore } from "react";

export type Crystal = { chapterId: string; chapterTitle: string; text: string; note: string; savedAt: string };

type State = {
  name: string;
  completed: string[];
  crystals: Crystal[];
  reflections: Record<string, string>;
};

const KEY = "eil-v2";
const empty: State = { name: "", completed: [], crystals: [], reflections: {} };

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...empty, ...JSON.parse(raw) } : empty;
  } catch {
    return empty;
  }
}

let state = load();
const listeners = new Set<() => void>();

function set(next: Partial<State>) {
  state = { ...state, ...next };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — keep in memory */
  }
  listeners.forEach((l) => l());
}

export function useStore() {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => state,
  );
}

export const actions = {
  setName: (name: string) => set({ name }),
  complete: (id: string) => !state.completed.includes(id) && set({ completed: [...state.completed, id] }),
  setReflection: (id: string, text: string) => set({ reflections: { ...state.reflections, [id]: text } }),
  saveCrystal: (c: Omit<Crystal, "savedAt">) =>
    set({ crystals: [...state.crystals.filter((x) => x.chapterId !== c.chapterId), { ...c, savedAt: new Date().toISOString() }] }),
  removeCrystal: (chapterId: string) => set({ crystals: state.crystals.filter((x) => x.chapterId !== chapterId) }),
  reset: () => set({ ...empty, name: state.name }),
};
