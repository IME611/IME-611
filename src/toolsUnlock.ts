import { journeyOrder } from "./content";
import { allTools, type Tool } from "./content/tools";
import { reviewMode } from "./review";

/** מיקום התחנה של הכלי במסע — כדי לסדר את הכלים לפי התוכן */
const order = (t: Tool) => {
  const i = journeyOrder.findIndex((c) => c.id === t.station);
  return i < 0 ? 999 : i;
};

export const toolsInJourneyOrder = [...allTools].sort((a, b) => order(a) - order(b));

/** "עזרה ראשונה" — קצרים, בטוחים ושימושיים לכל אחד. פתוחים תמיד, מהרגע הראשון */
export const FIRST_AID = ["pause", "slow-breath", "name-it"];
export const isFirstAid = (t: Tool) => FIRST_AID.includes(t.id);

/** כלי פתוח אם: עזרה ראשונה, או שסיימת את התחנה שלו, או שבחרת לפתוח אותו מוקדם */
export const isUnlocked = (t: Tool, done: Set<string>, early: string[] = []) =>
  reviewMode || isFirstAid(t) || done.has(t.station) || early.includes(t.id);

/** הכלים שנפתחים עכשיו בסיום התחנה (בלי עזרה ראשונה ובלי מה שכבר נפתח מוקדם) */
export const toolsForStation = (id: string, early: string[] = []) =>
  toolsInJourneyOrder.filter((t) => t.station === id && !isFirstAid(t) && !early.includes(t.id));
