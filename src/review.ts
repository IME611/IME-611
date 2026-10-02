/**
 * מצב סקירה — לעידן בלבד: פותח את כל התחנות בלי לעבור אותן לפי הסדר.
 * מפעילים עם ?review=1 בכתובת, מכבים עם ?review=0. נשמר בדפדפן הזה בלבד.
 */
export const reviewMode = (() => {
  try {
    const q = new URLSearchParams(window.location.search).get("review");
    if (q === "1") localStorage.setItem("eil-review", "1");
    if (q === "0") localStorage.removeItem("eil-review");
    return localStorage.getItem("eil-review") === "1";
  } catch {
    return false;
  }
})();
