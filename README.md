# E.I.L — המסע

מסע קריאה סגור ומובל: ממה שאני — אל המקור. 6 שלבים, כל פרק נבנה על הקודם, נעול לפי סדר.

## הוספת פרק
1. יוצרים `src/content/chapters/chXX.ts` לפי `src/content/types.ts`
2. רושמים אותו ב-`src/content/index.ts`
3. מוודאים שה-id שלו מופיע בשלב הנכון ב-`src/content/journey.ts`

אין צורך לגעת בקוד התצוגה. התוכן הישן (18 פרקים) שמור כחומר גלם ב-`content-archive/`.

## פיתוח
`npm install` · `npm run dev` · `npm run typecheck && npm run build`
