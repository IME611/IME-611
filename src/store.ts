import { useSyncExternalStore } from "react";

export type Crystal = { chapterId: string; chapterTitle: string; text: string; note: string; savedAt: string };

type State = {
  name: string;
  completed: string[];
  crystals: Crystal[];
  reflections: Record<string, string>;
  /** איפה הקורא עצר: תחנה, וקטע בתוכה (0 = תחילת התחנה) */
  place: { id: string; block: number; at: string } | null;
  /** כלים שהקורא כבר פתח (לסימון "חדש") */
  toolsSeen: string[];
  /** כלים שהקורא בחר לפתוח לפני התחנה שלהם */
  toolsEarly: string[];
};

const KEY = "eil-v2";
const empty: State = { name: "", completed: [], crystals: [], reflections: {}, place: null, toolsSeen: [], toolsEarly: [] };

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
  setPlace: (id: string, block: number) => {
    const p = state.place;
    if (p && p.id === id && p.block === block) return;
    set({ place: { id, block, at: new Date().toISOString() } });
  },
  seeTool: (id: string) => !state.toolsSeen.includes(id) && set({ toolsSeen: [...state.toolsSeen, id] }),
  openToolEarly: (id: string) => !state.toolsEarly.includes(id) && set({ toolsEarly: [...state.toolsEarly, id] }),
  reset: () => set({ ...empty, name: state.name }),
};
