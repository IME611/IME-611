import { journeyOrder } from "./content";
import { allTools, type Tool } from "./content/tools";
import { reviewMode } from "./review";

/** מיקום התחנה של הכלי במסע — כדי לסדר את הכלים לפי התוכן */
const order = (t: Tool) => {
  const i = journeyOrder.findIndex((c) => c.id === t.station);
  return i < 0 ? 999 : i;
};

export const toolsInJourneyOrder = [...allTools].sort((a, b) => order(a) - order(b));

/** כלי נפתח כשמסיימים את התחנה שהוא צומח ממנה */
export const isUnlocked = (t: Tool, done: Set<string>) => reviewMode || done.has(t.station);

export const toolsForStation = (id: string) => toolsInJourneyOrder.filter((t) => t.station === id);
