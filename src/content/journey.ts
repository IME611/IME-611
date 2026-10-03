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
      { id: "1b", title: "בלי לבקש רשות" },
      { id: "4", title: "מערכת ההפעלה" },
      { id: "4b", title: "חור המנעול" },
      { id: "5", title: "המוח בחושך" },
      { id: "5b", title: "המוח מבפנים" },
      { id: "12", title: "רגשות כמידע" },
      { id: "12b", title: "מי ששומע" },
    ],
  },
  {
    id: "where",
    number: 2,
    name: "איפה אני",
    question: "באיזה עולם הגוף הזה חי — ומה מחזיק אותו?",
    chapters: [
      { id: "2", title: "הכלי החיצוני" },
      { id: "8", title: "תדר וצליל" },
      { id: "8b", title: "כשהקול מצייר" },
      { id: "9", title: "הגוף כתדר" },
      { id: "9b", title: "קצבים שמתאחדים" },
    ],
  },
  {
    id: "not-random",
    number: 3,
    name: "זה לא מקרי",
    question: "האם כל זה יכול היה לקרות מעצמו?",
    chapters: [
      { id: "3", title: "הפלא ההנדסי" },
      { id: "3b", title: "השען העיוור" },
      { id: "origin", title: "יום ההולדת של היקום" },
      { id: "originb", title: "למה יש משהו ולא כלום" },
      { id: "information", title: "המידע שבתוך התא" },
      { id: "informationb", title: "התרנגולת והביצה" },
    ],
  },
  {
    id: "beyond",
    number: 4,
    name: "מה אני באמת",
    question: "האם אני רק חומר?",
    chapters: [
      { id: "6", title: "גלי המוח" },
      { id: "6b", title: "מסע בין קצבים" },
      { id: "7", title: "בלוטת האצטרובל" },
      { id: "7b", title: "מושב הנפש" },
      { id: "13", title: "איך זה להיות עטלף" },
      { id: "13b", title: "שני סדקים" },
    ],
  },
  {
    id: "why",
    number: 5,
    name: "למה אני פה",
    question: "אם יש תכנון — מה התפקיד שלי בו?",
    chapters: [
      { id: "10", title: "שביל במוח" },
      { id: "10b", title: "דרך עוקפת" },
      { id: "11", title: "אמונה בונה בית" },
      { id: "11b", title: "עיניים שמצפות" },
      { id: "14", title: "החוקים שלא מתפוררים" },
      { id: "14b", title: "\"12 חוקי היקום\"" },
      { id: "15", title: "שני סוגים של זמן" },
      { id: "15b", title: "החלום והמכשול" },
      { id: "16", title: "החירות האחרונה" },
      { id: "16b", title: "בדיעבד" },
    ],
  },
  {
    id: "source",
    number: 6,
    name: "המקור",
    question: "מה קורה כשהבנה הופכת לחיבור?",
    chapters: [
      { id: "17", title: "צעד אחורה" },
      { id: "17b", title: "תודה" },
      { id: "18", title: "מי אני — תשובה" },
      { id: "18b", title: "קשר ישיר" },
    ],
  },
];

/** שער הכניסה: הפרולוג — מי כתב את המסע ולמה. במפת המעגלים זו הנקודה שבמרכז ("אני"). */
export const gate: Stage = {
  id: "gate",
  number: 0,
  name: "לפני שמתחילים",
  question: "מי כתב את המסע הזה — ולמה?",
  chapters: [{ id: "prologue", title: "לפני שמתחילים" }],
};

export const STAGE_ORDINALS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שביעי", "שמיני"];
