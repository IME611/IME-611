import { chaptersById } from "../content";
import { inquiries } from "../content/inquiries";

const groups = [...new Set(inquiries.map((q) => q.group))];

export function Inquiries() {
  return (
    <div className="inquiries">
      <h1 className="journey-title">חקירות פתוחות</h1>
      <p className="journey-lead">
        טענות שנשמעות בכל מקום, בקורסים, בספרים ובסרטונים. כאן כל אחת מקבלת בדיקה הוגנת: מה באמת נמדד, ומה עדיין לא ידוע.
        לא כדי ללעוג, אלא כדי לדעת על מה אפשר לסמוך.
      </p>
      <nav className="inq-index" aria-label="נושאים">
        {groups.map((g) => (
          <a key={g} href={`#/inquiries`} onClick={(e) => { e.preventDefault(); document.getElementById(`g-${groups.indexOf(g)}`)?.scrollIntoView({ behavior: "smooth" }); }}>{g}</a>
        ))}
      </nav>
      {groups.map((g, gi) => (
      <section key={g} className="inq-group" id={`g-${gi}`}>
      <h2 className="tool-family-name">{g}</h2>
      <ul className="inq-list">
        {inquiries.filter((q) => q.group === g).map((q) => {
          const st = q.station ? chaptersById[q.station] : undefined;
          return (
            <li key={q.id} className="inq">
              <p className={`inq-verdict v-${q.verdict.replace(/\s/g, "-")}`}>{q.verdict}</p>
              <h3 className="inq-claim">{q.claim}</h3>
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
      </section>
      ))}
    </div>
  );
}
