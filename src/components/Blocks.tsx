import { useEffect, useRef, type ReactNode } from "react";
import type { Block } from "../content/types";
import { chaptersById, countItems } from "../content";

/** מופיע בעדינות כשנכנס למסך — קצב של "נפילת אסימון" */
function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) return el.classList.add("is-in");
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("is-in");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}

/** מקף שבא אחרי מילה נצמד אליה — כדי שלא ייפול לבד לשורה חדשה במובייל */
const glue = (l: string) => l.replace(/ —/g, "\u00A0—");

const lines = (t: string) => t.split("\n").map((l, i, a) => (
  <span key={i}>
    {glue(l)}
    {i < a.length - 1 && <br />}
  </span>
));

export function Blocks({ blocks, count }: { blocks: Block[]; count: number }) {
  const fill = (t: string) => t.replaceAll("{{count}}", String(count));
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "p":
            return <Reveal key={i}><p className="b-p">{lines(fill(b.text))}</p></Reveal>;
          case "heading":
            return <Reveal key={i} className="b-heading-wrap"><span className="b-ornament" aria-hidden>◆</span><h2 className="b-heading">{fill(b.text)}</h2></Reveal>;
          case "question":
            return <Reveal key={i}><p className="b-question">{fill(b.text)}</p></Reveal>;
          case "big":
            return <Reveal key={i}><p className="b-big">{lines(fill(b.text))}</p></Reveal>;
          case "pause":
            return (
              <Reveal key={i}>
                <aside className="b-pause">
                  <span className="b-breath" aria-hidden />
                  <p className="b-pause-title">{b.title}</p>
                  <p className="b-pause-text">{lines(b.text)}</p>
                </aside>
              </Reveal>
            );
          case "group":
            return (
              <Reveal key={i}>
                <section className="b-group">
                  <h3 className="b-group-title">{b.title}</h3>
                  {b.intro && <p className="b-group-intro">{b.intro}</p>}
                  <ul className="b-group-list">
                    {b.items.map((it) => (
                      <li key={it.name}>
                        <strong>{it.name}</strong>
                        <span>{it.detail}</span>
                      </li>
                    ))}
                  </ul>
                  {b.media && (
                    <div className="b-media" role="img" aria-label={b.media}>
                      <span className="b-media-play" aria-hidden>▶</span>
                      <span>{b.media}</span>
                      <small>בהכנה</small>
                    </div>
                  )}
                </section>
              </Reveal>
            );
          case "blindspot":
            return (
              <Reveal key={i}>
                <aside className="b-blindspot">
                  <p className="b-pause-title">ניסוי: הנקודה העיוורת</p>
                  <div className="b-blindspot-row" dir="ltr" aria-hidden>
                    <span className="b-blindspot-dot" />
                    <span className="b-blindspot-cross">✚</span>
                  </div>
                  <p className="b-pause-text">{lines(b.text)}</p>
                </aside>
              </Reveal>
            );
          case "wink":
            return (
              <Reveal key={i}>
                <aside className="b-wink">
                  {b.lines.map((l, j) => <p key={j}>{l}</p>)}
                </aside>
              </Reveal>
            );
          case "tradition":
            if (!b.approved) return null;
            return (
              <Reveal key={i}>
                <details className="b-tradition">
                  <summary>
                    <span>מקור יהודי</span>
                    <small>זווית נוספת — אפשר לאמץ, אפשר לא</small>
                  </summary>
                  <p>{lines(b.text)}</p>
                  <cite>{b.source}</cite>
                </details>
              </Reveal>
            );
          case "echo":
            return (
              <Reveal key={i}>
                <aside className="b-echo">
                  <small>זוכר? {chaptersById[b.chapterId]?.title ?? ""}</small>
                  <p>{(() => {
                    const ref = chaptersById[b.chapterId];
                    return b.text.replaceAll("{{count}}", ref ? String(countItems(ref)) : "");
                  })()}</p>
                </aside>
              </Reveal>
            );
        }
      })}
    </>
  );
}
