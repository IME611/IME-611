import type { Chapter } from "./types";
import { journey, gate } from "./journey";
import { ch01, ch01b } from "./chapters/ch01";
import { ch04, ch04b } from "./chapters/ch04";
import { ch05, ch05b } from "./chapters/ch05";
import { ch12, ch12b } from "./chapters/ch12";
import { ch02 } from "./chapters/ch02";
import { ch08, ch08b } from "./chapters/ch08";
import { ch09, ch09b } from "./chapters/ch09";
import { ch03, ch03b } from "./chapters/ch03";
import { chorigin, choriginb } from "./chapters/chorigin";
import { chinformation, chinformationb } from "./chapters/chinformation";
import { ch06, ch06b } from "./chapters/ch06";
import { ch07, ch07b } from "./chapters/ch07";
import { ch13, ch13b } from "./chapters/ch13";
import { ch10, ch10b } from "./chapters/ch10";
import { ch11, ch11b } from "./chapters/ch11";
import { ch14, ch14b } from "./chapters/ch14";
import { ch15, ch15b } from "./chapters/ch15";
import { ch16, ch16b } from "./chapters/ch16";
import { ch17, ch17b } from "./chapters/ch17";
import { ch18, ch18b } from "./chapters/ch18";
import { chroutine } from "./chapters/chroutine";
import { chprologue } from "./chapters/chprologue";

/** כל פרק שנכתב נרשם כאן. */
const written: Chapter[] = [ch01, ch01b, ch04, ch04b, ch05, ch05b, ch12, ch12b, ch02, ch08, ch08b, ch09, ch09b, ch03, ch03b, chorigin, choriginb, chinformation, chinformationb, ch06, ch06b, ch07, ch07b, ch13, ch13b, ch10, ch10b, ch11, ch11b, ch14, ch14b, ch15, ch15b, chroutine, ch16, ch16b, ch17, ch17b, ch18, ch18b];

export const chaptersById: Record<string, Chapter> = Object.fromEntries([chprologue, ...written].map((c) => [c.id, c]));

/** רשימה שטוחה של כל הפרקים לפי סדר המסע */
export const journeyOrder = [gate, ...journey].flatMap((stage) =>
  stage.chapters.map((c) => ({ ...c, stage, ready: Boolean(chaptersById[c.id]) })),
);

export function countItems(chapter: Chapter): number {
  return chapter.blocks.reduce((n, b) => n + (b.type === "group" ? b.items.length : 0), 0);
}

/** התחנות עצמן, בלי שער הכניסה — לספירה ולתצוגה */
export const stationsOrder = journeyOrder.filter((c) => c.stage.number > 0);

export { journey, gate };

/** זמן קריאה משוער בדקות (כ־150 מילים לדקה — קריאה רגועה, עם עצירות) */
export function readMinutes(chapter: Chapter): number {
  const text = [chapter.opening, ...chapter.blocks.filter((b) => b.type !== "tradition").map((b) => JSON.stringify(b)), chapter.reflection, chapter.crystal].join(" ");
  const words = text.match(/[֐-׿]+/g)?.length ?? 0;
  return Math.max(2, Math.round(words / 150));
}
