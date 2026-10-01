import type { Stage } from "./types";

/**
 * מבנה המסע: ממה שאני — אל המקור.
 * שמות הפרקים כאן הם טיוטה לפי המיפוי של 18 הפרקים הקיימים; פרק שאין לו
 * קובץ תוכן ב-chapters/ מוצג כ"בהכנה" ונשאר נעול.
 */
export const journey: Stage[] = [
  {
    id: "who",
    number: 1,
    name: "מי אני",
    question: "מה בעצם מחזיק אותי בחיים — ברגע זה ממש?",
    chapters: [
      { id: "1", title: "התבוננות" },
      { id: "4", title: "מערכת ההפעלה" },
      { id: "5", title: "המוח" },
      { id: "12", title: "רגשות כמידע" },
    ],
  },
  {
    id: "where",
    number: 2,
    name: "איפה אני",
    question: "באיזה עולם הגוף הזה חי — ומה מחזיק אותו?",
    chapters: [
      { id: "2", title: "הכלי החיצוני" },
      { id: "8", title: "תדר, צליל וצורה" },
      { id: "9", title: "הגוף כתדר" },
    ],
  },
  {
    id: "not-random",
    number: 3,
    name: "זה לא מקרי",
    question: "האם כל זה יכול היה לקרות מעצמו?",
    chapters: [
      { id: "3", title: "הפלא ההנדסי" },
      { id: "origin", title: "למה יש משהו ולא כלום" },
      { id: "information", title: "המידע שבתוך התא" },
    ],
  },
  {
    id: "beyond",
    number: 4,
    name: "מה אני באמת",
    question: "האם אני רק חומר?",
    chapters: [
      { id: "6", title: "גלי המוח" },
      { id: "7", title: "בלוטת האצטרובל" },
      { id: "13", title: "התודעה והקוונטים" },
    ],
  },
  {
    id: "why",
    number: 5,
    name: "למה אני פה",
    question: "אם יש תכנון — מה התפקיד שלי בו?",
    chapters: [
      { id: "10", title: "נוירופלסטיות" },
      { id: "11", title: "זהויות ואמונות" },
      { id: "14", title: "חוקי היקום" },
      { id: "15", title: "חזון ומימוש" },
      { id: "16", title: "סבל, קושי ומשמעות" },
    ],
  },
  {
    id: "source",
    number: 6,
    name: "המקור",
    question: "מה קורה כשהבנה הופכת לחיבור?",
    chapters: [
      { id: "17", title: "חיבור הכל" },
      { id: "18", title: "מי אני — תשובה" },
    ],
  },
];

export const STAGE_ORDINALS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שביעי", "שמיני"];
