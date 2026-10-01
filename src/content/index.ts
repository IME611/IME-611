import type { Chapter } from "./types";
import { journey } from "./journey";
import { ch01 } from "./chapters/ch01";

/** כל פרק שנכתב נרשם כאן. */
const written: Chapter[] = [ch01];

export const chaptersById: Record<string, Chapter> = Object.fromEntries(written.map((c) => [c.id, c]));

/** רשימה שטוחה של כל הפרקים לפי סדר המסע */
export const journeyOrder = journey.flatMap((stage) =>
  stage.chapters.map((c) => ({ ...c, stage, ready: Boolean(chaptersById[c.id]) })),
);

export function countItems(chapter: Chapter): number {
  return chapter.blocks.reduce((n, b) => n + (b.type === "group" ? b.items.length : 0), 0);
}

export { journey };
