import type { Chapter } from "./content/types";
import { chaptersById, countItems } from "./content";

/**
 * הקראה: פירוק תחנה ל"קטעים" — כל קטע הוא יחידה אחת שמוקראת ומודגשת במסך.
 * ההקראה מתחילה ישר מהשאלה הפותחת (בלי כותרת, תפריט או כפתורים).
 * target = מזהה האלמנט במסך שאליו גוללים ושאותו מדגישים.
 */
export type Segment = { text: string; target: string };

const clean = (t: string) =>
  t
    .replace(/\n+/g, " ")
    .replace(/[—–]/g, ", ")
    .replace(/[◆✡↩❓🎬👁]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

export function buildSegments(chapter: Chapter): Segment[] {
  const count = countItems(chapter);
  const fill = (t: string) => t.replaceAll("{{count}}", String(count));
  const segs: Segment[] = [{ text: chapter.opening, target: "opening" }];
  chapter.blocks.forEach((b, i) => {
    const target = `b${i}`;
    switch (b.type) {
      case "p":
      case "heading":
      case "question":
      case "big":
      case "blindspot":
        segs.push({ text: fill(b.text), target });
        break;
      case "pause":
        segs.push({ text: `${b.title}. ${b.text}`, target });
        break;
      case "group":
        segs.push({ text: [b.title, b.intro].filter(Boolean).join(". "), target });
        b.items.forEach((it) => segs.push({ text: `${it.name}. ${it.detail}`, target }));
        break;
      case "wink":
        segs.push({ text: b.lines.join(" "), target });
        break;
      case "echo": {
        const ref = chaptersById[b.chapterId];
        segs.push({ text: `זוכר? ${b.text.replaceAll("{{count}}", ref ? String(countItems(ref)) : "")}`, target });
        break;
      }
      case "tradition":
        // שכבה אופציונלית, סגורה כברירת מחדל — לא מוקראת אוטומטית
        break;
    }
  });
  segs.push({ text: `לפני שממשיכים. ${chapter.reflection}`, target: "reflection" });
  segs.push({ text: `הקריסטל של התחנה. ${chapter.crystal}`, target: "crystal" });
  return segs.map((s) => ({ ...s, text: clean(s.text) })).filter((s) => s.text);
}

/** בחירת הקול העברי הכי טבעי שקיים במכשיר */
export function pickHebrewVoice(): SpeechSynthesisVoice | null {
  if (!("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices().filter((v) => /^he|^iw/i.test(v.lang));
  if (!voices.length) return null;
  const score = (v: SpeechSynthesisVoice) =>
    (/natural|neural|online/i.test(v.name) ? 40 : 0) + // Edge: Microsoft Hila / Avri Online (Natural)
    (/google/i.test(v.name) ? 25 : 0) +
    (/hila|avri/i.test(v.name) ? 10 : 0) +
    (/enhanced|premium/i.test(v.name) ? 15 : 0) + // iOS: Carmit (Enhanced)
    (v.localService ? 0 : 3);
  return voices.sort((a, b) => score(b) - score(a))[0];
}

export const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];
