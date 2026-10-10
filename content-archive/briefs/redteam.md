# Red Team — ביקורת על כל אתר E.I.L (קריאה בלבד)

האתר: מסע קריאה בעברית, 40 תחנות קצרות, מ"מי אני" ועד "המקור". קהל: אנשים בלי רקע מדעי, בעיקר בטלפון. מטרה: פליאה, בהירות, אמת. מקורות יהודיים הם שכבה אופציונלית. טענות ניו־אייג' נבדקות בהגינות במדור "חקירות פתוחות".
הקוד: /home/claude/eil (React + Vite). תוכן: src/content/journey.ts (סדר), src/content/chapters/*.ts (תחנות), src/content/tools.ts, src/content/inquiries.ts. מסכים: src/screens/*. אתר מקומי לבדיקה: `cd /home/claude/eil && npm run build && (setsid npx vite preview --port 4173 >/dev/null 2>&1 < /dev/null &)` ואז http://localhost:4173/?review=1#/journey (Playwright: chromium ב־/opt/pw-browsers/chromium, `import { chromium } from "playwright"` מתוך תיקייה שבה playwright מותקן — /home/claude/eil או /tmp/claude-0/shots).

**אל תשנה שום קובץ.** רק ביקורת. אל תריץ git.

## פורמט הדיווח (עד 450 מילים, בעברית)
רשימה ממוינת לפי חומרה: 🔴 חייב תיקון / 🟠 כדאי / 🟢 קטן.
כל פריט: מיקום מדויק (קובץ + id תחנה + ציטוט קצר) → הבעיה → הצעת תיקון בשורה אחת.
בלי מחמאות, בלי הקדמות. רק ממצאים שאפשר לפעול לפיהם. אם משהו טוב — אל תכתוב עליו.
