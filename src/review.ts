/**
 * מצב סקירה — לעידן בלבד: פותח את כל התחנות והכלים בלי לעבור אותם לפי הסדר.
 * פעיל רק כשבכתובת יש ?review=1. בלי זה האתר מתנהג בדיוק כמו אצל קורא חדש.
 */
export const reviewMode = (() => {
  try {
    localStorage.removeItem("eil-review"); // ניקוי מגרסה קודמת שבה המצב נשמר בדפדפן
  } catch {
    /* לא חובה */
  }
  try {
    return new URLSearchParams(window.location.search).get("review") === "1";
  } catch {
    return false;
  }
})();
