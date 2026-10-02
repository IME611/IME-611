import type { Chapter } from "./types";
import { journey } from "./journey";
import { ch01 } from "./chapters/ch01";
import { ch04 } from "./chapters/ch04";
import { ch05 } from "./chapters/ch05";
import { ch12 } from "./chapters/ch12";
import { ch02 } from "./chapters/ch02";
import { ch08 } from "./chapters/ch08";
import { ch09 } from "./chapters/ch09";
import { ch03 } from "./chapters/ch03";
import { chorigin } from "./chapters/chorigin";
import { chinformation } from "./chapters/chinformation";
import { ch06 } from "./chapters/ch06";
import { ch07 } from "./chapters/ch07";
import { ch13 } from "./chapters/ch13";
import { ch10 } from "./chapters/ch10";
import { ch11 } from "./chapters/ch11";
import { ch14 } from "./chapters/ch14";
import { ch15 } from "./chapters/ch15";
import { ch16 } from "./chapters/ch16";
import { ch17 } from "./chapters/ch17";
import { ch18 } from "./chapters/ch18";
import { chprologue } from "./chapters/chprologue";

/** כל פרק שנכתב נרשם כאן. */
const written: Chapter[] = [ch01, ch04, ch05, ch12, ch02, ch08, ch09, ch03, chorigin, chinformation, ch06, ch07, ch13, ch10, ch11, ch14, ch15, ch16, ch17, ch18];

export const chaptersById: Record<string, Chapter> = Object.fromEntries([...written, chprologue].map((c) => [c.id, c]));

/** רשימה שטוחה של כל הפרקים לפי סדר המסע */
export const journeyOrder = journey.flatMap((stage) =>
  stage.chapters.map((c) => ({ ...c, stage, ready: Boolean(chaptersById[c.id]) })),
);

export function countItems(chapter: Chapter): number {
  return chapter.blocks.reduce((n, b) => n + (b.type === "group" ? b.items.length : 0), 0);
}

export { journey };
