/**
 * מודל התוכן של המסע.
 * כל פרק הוא רצף של "רגעים" (blocks). כדי להוסיף פרק — יוצרים קובץ ב-chapters/
 * ומוסיפים את ה-id שלו לשלב המתאים ב-journey.ts. אין צורך לגעת בקוד התצוגה.
 */

export type Block =
  /** פסקה קצרה — 1 עד 4 שורות */
  | { type: "p"; text: string }
  /** כותרת פנימית שפותחת קטע חדש */
  | { type: "heading"; text: string }
  /** שאלה שנשאלת את הקורא — מודגשת */
  | { type: "question"; text: string }
  /** רגע של עצירה — הזמנה לנשום ולהתבונן */
  | { type: "pause"; title: string; text: string }
  /** משפט השתאות — גדול, במרכז */
  | { type: "big"; text: string }
  /** קבוצת מערכות/פריטים — כותרת במרכז ורשימה מתחתיה */
  | { type: "group"; title: string; intro?: string; items: { name: string; detail: string }[]; media?: string }
  /** ניסוי הנקודה העיוורת — עיגול משמאל, צלב מימין (לעין שמאל) */
  | { type: "blindspot"; text: string }
  /** קריצה לקורא */
  | { type: "wink"; lines: string[] }
  /** חוט ספירלי — חזרה לרעיון מפרק קודם והעלאתו קומה. {{count}} כאן = מספר הפריטים בפרק המוזכר */
  | { type: "echo"; chapterId: string; text: string }
  /**
   * מקור יהודי — מוצג כאפשרות, לא כהוכחה. הקורא יכול לאמץ או לא.
   * מוצג באתר רק כשעידן ו-Claude עברו עליו ביחד וסימנו approved: true.
   */
  | { type: "tradition"; text: string; source: string; approved: boolean };

export type Chapter = {
  id: string;
  title: string;
  subtitle: string;
  /** השאלה שפותחת את הפרק */
  opening: string;
  blocks: Block[];
  /** עצירה בסוף הפרק — לא מבחן */
  reflection: string;
  /** התובנה שאפשר לשמור למרחב האישי */
  crystal: string;
};

export type Stage = {
  id: string;
  number: number;
  name: string;
  /** השאלה של השלב */
  question: string;
  /** פרקים לפי סדר. פרק בלי תוכן מוצג כ"בהכנה". */
  chapters: { id: string; title: string }[];
};
