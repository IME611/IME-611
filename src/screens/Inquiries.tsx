import { chaptersById } from "../content";
import { inquiries } from "../content/inquiries";

export function Inquiries() {
  return (
    <div className="inquiries">
      <h1 className="journey-title">חקירות פתוחות</h1>
      <p className="journey-lead">
        טענות שנשמעות בכל מקום — בקורסים, בספרים ובסרטונים. כאן כל אחת מקבלת בדיקה הוגנת: מה באמת נמדד, ומה עדיין לא ידוע.
        לא כדי ללעוג, אלא כדי לדעת על מה אפשר לסמוך.
      </p>
      <ul className="inq-list">
        {inquiries.map((q) => {
          const st = q.station ? chaptersById[q.station] : undefined;
          return (
            <li key={q.id} className="inq">
              <p className={`inq-verdict v-${q.verdict.replace(/\s/g, "-")}`}>{q.verdict}</p>
              <h2 className="inq-claim">{q.claim}</h2>
              <p className="inq-heard">{q.heard}</p>
              <dl className="inq-dl">
                <dt>מה באמת נמדד</dt>
                <dd>{q.measured}</dd>
                <dt>מה לא הוכח</dt>
                <dd>{q.open}</dd>
              </dl>
              {st && <p className="inq-station">קשור לתחנה "{st.title}"</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
