import { useEffect, useRef } from "react";

/**
 * איורים מונפשים קטנים, מצוירים בקוד (canvas). בלי קבצים חיצוניים.
 * כל איור: רץ רק כשהוא על המסך, ונעצר על פריים יציב כשהמשתמש ביקש פחות תנועה.
 */
export type FigureKind = "wave" | "chladni" | "sync" | "slits" | "expand" | "path" | "dna" | "leaf";

const GOLD = "#a8832a";
const GOLD_SOFT = "rgba(168,131,42,.28)";
const EMERALD = "#00492f";
const INK = "#26221c";
const INK_SOFT = "rgba(38,34,28,.38)";

type Draw = (c: CanvasRenderingContext2D, w: number, h: number, t: number, state: any) => void;
type Spec = { h: number; init?: (w: number, h: number) => any; draw: Draw };

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

/** גל דחיסה: שכבות אוויר זזות הלוך ושוב, הדחיסה מתקדמת */
const wave: Spec = {
  h: 170,
  draw(c, w, h, t) {
    const n = 40, pad = 18, gap = (w - pad * 2) / (n - 1);
    const k = (2 * Math.PI) / (gap * 15), om = 2.2;
    // מקור הצליל: מיתר רועד משמאל
    const sx = pad - 4 + Math.sin(t * om) * 3;
    c.strokeStyle = GOLD; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(sx, 30); c.lineTo(sx, h - 46); c.stroke();
    for (let i = 1; i < n; i++) {
      const x0 = pad + i * gap;
      const dx = Math.sin(k * x0 - om * t) * gap * 1.5;
      const x = x0 - dx;
      const marked = i === 20;
      c.strokeStyle = marked ? EMERALD : INK_SOFT;
      c.lineWidth = marked ? 3 : 1.4;
      c.beginPath(); c.moveTo(x, 30); c.lineTo(x, h - 46); c.stroke();
      if (marked) {
        c.fillStyle = EMERALD; c.beginPath(); c.arc(x, h - 34, 4, 0, Math.PI * 2); c.fill();
        c.strokeStyle = "rgba(0,73,47,.35)"; c.lineWidth = 1; c.setLineDash([3, 3]);
        c.beginPath(); c.moveTo(x0 - gap * 1.5, h - 22); c.lineTo(x0 + gap * 1.5, h - 22); c.stroke(); c.setLineDash([]);
      }
    }
    // חץ: הדחיסה מתקדמת
    const cx = ((om * t) / k + pad) % (w - pad * 2) + pad;
    c.fillStyle = GOLD; c.beginPath();
    c.moveTo(cx + 9, 16); c.lineTo(cx - 3, 10); c.lineTo(cx - 3, 22); c.closePath(); c.fill();
  },
};

/** לוח כלדני: גרגרי חול נודדים אל הקווים שבהם הלוח לא זז */
const MODES = [[1, 4], [2, 5], [3, 5], [1, 6], [4, 7], [2, 3]];
const chladni: Spec = {
  h: 300,
  init: () => ({ pts: Array.from({ length: 2200 }, () => [Math.random(), Math.random()]), mode: 0, since: 0 }),
  draw(c, w, h, t, s) {
    const size = Math.min(w - 40, h - 20), ox = (w - size) / 2, oy = (h - size) / 2;
    if (t - s.since > 6.5) {
      s.since = t; s.mode = (s.mode + 1) % MODES.length;
      for (const p of s.pts) { p[0] = Math.random(); p[1] = Math.random(); }
    }
    const [m, n] = MODES[s.mode];
    const f = (x: number, y: number) =>
      Math.cos(n * Math.PI * x) * Math.cos(m * Math.PI * y) - Math.cos(m * Math.PI * x) * Math.cos(n * Math.PI * y);
    c.fillStyle = "rgba(38,34,28,.86)";
    c.beginPath(); c.roundRect(ox, oy, size, size, 10); c.fill();
    c.fillStyle = "#f3e2ad";
    for (const p of s.pts) {
      const a = Math.abs(f(p[0], p[1]));
      const j = 0.035 * a + 0.0008;
      p[0] = Math.min(1, Math.max(0, p[0] + rnd(-j, j)));
      p[1] = Math.min(1, Math.max(0, p[1] + rnd(-j, j)));
      c.fillRect(ox + p[0] * size, oy + p[1] * size, 1.6, 1.6);
    }
  },
};

/** שני שעונים על קורה אחת: מתחילים בקצב שונה ומתאחדים */
const sync: Spec = {
  h: 230,
  init: () => ({ p1: 0, p2: 2.2, last: 0, start: 0 }),
  draw(c, w, h, t, s) {
    if (t - s.start > 16) { s.p1 = 0; s.p2 = rnd(1, 2.6); s.start = t; s.last = t; }
    const dt = Math.min(0.05, t - s.last); s.last = t;
    const om = 3.2, K = 0.55;
    // צימוד דרך הקורה, מושך למצב של כיוונים מנוגדים
    s.p1 += (om + K * Math.sin(s.p2 - s.p1 - Math.PI)) * dt;
    s.p2 += (om * 1.03 + K * Math.sin(s.p1 - s.p2 - Math.PI)) * dt;
    const a1 = 0.5 * Math.sin(s.p1), a2 = 0.5 * Math.sin(s.p2);
    const beam = 40 + (a1 + a2) * 2.2;
    c.strokeStyle = GOLD; c.lineWidth = 5; c.lineCap = "round";
    c.beginPath(); c.moveTo(w * 0.12 + (a1 + a2) * 3, beam); c.lineTo(w * 0.88 + (a1 + a2) * 3, beam); c.stroke();
    const L = h - 90;
    [[w * 0.34, a1], [w * 0.66, a2]].forEach(([x, a]) => {
      const bx = x + Math.sin(a) * L, by = beam + Math.cos(a) * L;
      c.strokeStyle = INK; c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(x, beam); c.lineTo(bx, by); c.stroke();
      c.fillStyle = EMERALD; c.beginPath(); c.arc(bx, by, 13, 0, Math.PI * 2); c.fill();
      c.fillStyle = "rgba(255,255,255,.35)"; c.beginPath(); c.arc(bx - 4, by - 4, 4, 0, Math.PI * 2); c.fill();
    });
    // מד התיאום: ככל שההפרש קרוב לחצי סיבוב, הפס מתמלא
    const d = Math.abs(Math.cos((s.p1 - s.p2) / 2));
    const fill = 1 - d;
    c.fillStyle = GOLD_SOFT; c.beginPath(); c.roundRect(w * 0.3, h - 18, w * 0.4, 6, 3); c.fill();
    c.fillStyle = GOLD; c.beginPath(); c.roundRect(w * 0.3, h - 18, w * 0.4 * fill, 6, 3); c.fill();
  },
};

/** שני סדקים: נקודה אחרי נקודה, נבנים פסים */
const slits: Spec = {
  h: 230,
  init: () => ({ hits: [] as number[][], acc: 0, last: 0 }),
  draw(c, w, h, t, s) {
    const dt = Math.min(0.05, t - s.last); s.last = t;
    const sx = w * 0.18, scr = w * 0.86, top = 18, bot = h - 18, mid = (top + bot) / 2;
    // מחסום עם שני סדקים
    c.fillStyle = INK;
    c.fillRect(sx - 3, top, 6, mid - 22 - top);
    c.fillRect(sx - 3, mid - 10, 6, 20);
    c.fillRect(sx - 3, mid + 22, 6, bot - mid - 22);
    // מסך
    c.fillStyle = "rgba(38,34,28,.08)"; c.fillRect(scr - 4, top, 26, bot - top);
    s.acc += dt * 140;
    while (s.acc > 1) {
      s.acc -= 1;
      let y = 0;
      for (;;) {
        const u = rnd(-1, 1);
        const pr = Math.pow(Math.cos(u * Math.PI * 3.2), 2) * Math.exp(-u * u * 2.2);
        if (Math.random() < pr) { y = u; break; }
      }
      s.hits.push([scr + rnd(0, 18), mid + y * (bot - top) / 2, t]);
    }
    if (s.hits.length > 2200) s.hits = [];
    c.fillStyle = EMERALD;
    for (const [x, y] of s.hits) c.fillRect(x, y, 1.8, 1.8);
    // אלקטרון בדרך
    const ph = (t * 1.6) % 1;
    c.fillStyle = GOLD; c.beginPath();
    c.arc(w * 0.04 + ph * (sx - w * 0.04), mid, 3.5, 0, Math.PI * 2); c.fill();
    if (ph < 0.98) {
      c.strokeStyle = "rgba(168,131,42,.25)"; c.lineWidth = 1;
      for (let r = 8; r < 60; r += 14) {
        const rr = r + ((t * 40) % 14);
        [mid - 16, mid + 16].forEach((yy) => { c.beginPath(); c.arc(sx, yy, rr, -0.9, 0.9); c.stroke(); });
      }
    }
  },
};

/** עוגת צימוקים: המרחב גדל, ומכל צימוק נראה שהשאר מתרחקים */
const expand: Spec = {
  h: 260,
  init: () => ({ r: Array.from({ length: 16 }, (_, i) => (i === 0 ? [0.05, -0.05] : [rnd(-0.85, 0.85), rnd(-0.75, 0.75)])) }),
  draw(c, w, h, t, s) {
    const ph = (t % 9) / 9;
    const sc = 0.45 + 0.55 * (ph < 0.85 ? ph / 0.85 : 1);
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.46 * sc;
    const g = c.createRadialGradient(cx, cy - R * 0.3, R * 0.2, cx, cy, R);
    g.addColorStop(0, "#f6e6bd"); g.addColorStop(1, "#e2c58a");
    c.fillStyle = g; c.beginPath(); c.ellipse(cx, cy, R * 1.25, R, 0, 0, Math.PI * 2); c.fill();
    const pos = s.r.map(([x, y]: number[]) => [cx + x * R * 1.15, cy + y * R * 0.95]);
    const [hx, hy] = pos[0];
    c.strokeStyle = "rgba(0,73,47,.35)"; c.lineWidth = 1;
    pos.slice(1, 7).forEach(([x, y]: number[]) => { c.beginPath(); c.moveTo(hx, hy); c.lineTo(x, y); c.stroke(); });
    pos.forEach(([x, y]: number[], i: number) => {
      c.fillStyle = i === 0 ? EMERALD : "#5a3a1e";
      c.beginPath(); c.ellipse(x, y, i === 0 ? 6 : 4.5, i === 0 ? 5 : 3.5, 0.5, 0, Math.PI * 2); c.fill();
    });
  },
};

/** שביל בשדה: כל מעבר משטיח עוד קצת את העשב */
const path: Spec = {
  h: 220,
  init: (w, h) => {
    const blades = [] as number[][];
    for (let i = 0; i < 900; i++) blades.push([rnd(0, w), rnd(14, h - 6), 0, rnd(7, 13)]);
    return { blades, walk: 0, last: 0, start: 0 };
  },
  draw(c, w, h, t, s) {
    if (t - s.start > 26) { s.start = t; for (const b of s.blades) b[2] = 0; }
    const lt = t - s.start;
    const route = (x: number) => h * 0.55 + Math.sin(x / w * Math.PI * 2) * h * 0.18;
    const trip = 2.6, k = Math.floor(lt / trip), ph = (lt % trip) / trip;
    const walking = k < 8;
    const wx = ph * (w + 20) - 10, wy = route(wx) + Math.sin(k * 7) * 6;
    if (walking) for (const b of s.blades) {
      if (Math.abs(b[0] - wx) < 10 && Math.abs(b[1] - route(b[0])) < 11) b[2] = Math.min(1, b[2] + 0.05);
    } else for (const b of s.blades) b[2] = Math.max(0, b[2] - 0.0015);
    for (const b of s.blades) {
      const flat = b[2];
      c.strokeStyle = flat > 0.5 ? `rgba(168,131,42,${0.25 + flat * 0.3})` : `rgba(0,73,47,${0.55 - flat * 0.4})`;
      c.lineWidth = 1.2;
      const len = b[3] * (1 - flat * 0.85);
      c.beginPath(); c.moveTo(b[0], b[1]); c.lineTo(b[0] + 2 + flat * 6, b[1] - len); c.stroke();
    }
    if (walking) { c.fillStyle = INK; c.beginPath(); c.arc(wx, wy - 4, 4.5, 0, Math.PI * 2); c.fill(); }
  },
};

/** סליל DNA מסתובב, עם זוגות משלימים */
const PAIRS = "ATCGGATCCTAGTA".split("");
const COMP: Record<string, string> = { A: "T", T: "A", C: "G", G: "C" };
const BASE: Record<string, string> = { A: "#00492f", T: "#a8832a", C: "#6d4c8a", G: "#b5523b" };
const dna: Spec = {
  h: 210,
  draw(c, w, h, t) {
    const n = PAIRS.length, pad = 22, step = (w - pad * 2) / (n - 1), cy = h / 2, A = h * 0.3;
    for (let i = 0; i < n; i++) {
      const x = pad + i * step, a = i * 0.55 + t * 0.9;
      const y1 = cy + Math.sin(a) * A, y2 = cy - Math.sin(a) * A, front = Math.cos(a) > 0;
      const b1 = PAIRS[i], b2 = COMP[b1];
      c.globalAlpha = front ? 1 : 0.45;
      c.lineWidth = 3;
      c.strokeStyle = BASE[b1]; c.beginPath(); c.moveTo(x, y1); c.lineTo(x, cy); c.stroke();
      c.strokeStyle = BASE[b2]; c.beginPath(); c.moveTo(x, cy); c.lineTo(x, y2); c.stroke();
      c.globalAlpha = 1;
      if (Math.abs(Math.sin(a)) > 0.55 && step > 13) {
        c.font = "700 11px Assistant, sans-serif"; c.textAlign = "center"; c.fillStyle = INK;
        c.fillText(b1, x, y1 + (y1 > cy ? 14 : -7)); c.fillText(b2, x, y2 + (y2 > cy ? 14 : -7));
      }
    }
    [1, -1].forEach((sg) => {
      c.strokeStyle = INK; c.lineWidth = 2; c.beginPath();
      for (let x = pad; x <= w - pad; x += 3) {
        const a = ((x - pad) / step) * 0.55 + t * 0.9, y = cy + sg * Math.sin(a) * A;
        x === pad ? c.moveTo(x, y) : c.lineTo(x, y);
      }
      c.stroke();
    });
  },
};

/** אור לבן פוגע בעלה: הכל נבלע חוץ מהירוק, שמגיע לעין */
const COLORS = ["#d23b3b", "#e8892c", "#e6c43a", "#3aa35a", "#3b6fd2", "#7a4fc8"];
const leaf: Spec = {
  h: 240,
  draw(c, w, h, t) {
    const sun = [w * 0.12, 40], lf = [w * 0.5, h - 60], eye = [w * 0.86, 56];
    c.fillStyle = "#e6c43a"; c.beginPath(); c.arc(sun[0], sun[1], 18, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "rgba(230,196,58,.5)"; c.lineWidth = 2;
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + t * 0.3; c.beginPath(); c.moveTo(sun[0] + Math.cos(a) * 24, sun[1] + Math.sin(a) * 24); c.lineTo(sun[0] + Math.cos(a) * 31, sun[1] + Math.sin(a) * 31); c.stroke(); }
    // עלה
    c.fillStyle = "#2f8a4c"; c.beginPath();
    c.ellipse(lf[0], lf[1] + 14, 64, 20, -0.12, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "#1d5e33"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(lf[0] - 60, lf[1] + 21); c.lineTo(lf[0] + 62, lf[1] + 6); c.stroke();
    // עין
    c.fillStyle = "#fff"; c.strokeStyle = INK; c.lineWidth = 1.6;
    c.beginPath(); c.ellipse(eye[0], eye[1], 22, 13, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = EMERALD; c.beginPath(); c.arc(eye[0] - 6, eye[1], 7, 0, Math.PI * 2); c.fill();
    c.fillStyle = INK; c.beginPath(); c.arc(eye[0] - 7, eye[1], 3, 0, Math.PI * 2); c.fill();
    // קרני אור: יוצאות מהשמש כתערובת, רק הירוק חוזר לעין
    for (let j = 0; j < 3; j++) {
      const ph = ((t * 0.45 + j / 3) % 1);
      if (ph < 0.5) {
        const p = ph / 0.5;
        COLORS.forEach((col, i) => {
          const off = (i - 2.5) * 3;
          const x = sun[0] + (lf[0] - sun[0]) * p + off, y = sun[1] + (lf[1] - sun[1]) * p;
          c.fillStyle = col; c.beginPath(); c.arc(x, y, 2.6, 0, Math.PI * 2); c.fill();
        });
      } else {
        const p = (ph - 0.5) / 0.5;
        const x = lf[0] + (eye[0] - 26 - lf[0]) * p, y = lf[1] + (eye[1] - lf[1]) * p;
        c.fillStyle = "#3aa35a"; c.beginPath(); c.arc(x, y, 3.4, 0, Math.PI * 2); c.fill();
        if (p < 0.25) {
          c.fillStyle = `rgba(210,59,59,${0.6 - p * 2.4})`;
          c.beginPath(); c.arc(lf[0] - 8, lf[1] + 14, 6 + p * 20, 0, Math.PI * 2); c.fill();
        }
      }
    }
    c.font = "600 13px Assistant, sans-serif"; c.fillStyle = INK; c.textAlign = "center";
    c.fillText("שמש", sun[0], sun[1] + 40);
    c.fillText("עלה", lf[0], lf[1] + 52);
    c.fillText("עין", eye[0], eye[1] + 32);
  },
};

const SPECS: Record<FigureKind, Spec> = { wave, chladni, sync, slits, expand, path, dna, leaf };

export function Figure({ kind, caption }: { kind: FigureKind; caption: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const spec = SPECS[kind];
  useEffect(() => {
    const cv = ref.current;
    if (!cv || !spec) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let w = 0, state: any = null, raf = 0, visible = false;
    const t0 = performance.now();
    const size = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = cv.clientWidth || 320;
      cv.width = w * dpr; cv.height = spec.h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      state = spec.init ? spec.init(w, spec.h) : {};
    };
    const frame = (now: number) => {
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, spec.h);
      try { spec.draw(ctx, w, spec.h, t, state); } catch { /* איור לא חיוני */ }
      if (visible && !reduce) raf = requestAnimationFrame(frame);
    };
    size();
    if (reduce) {
      // פריים יציב: מריצים את הסימולציה קדימה בשקט ומציירים פעם אחת
      for (let i = 0; i < 240; i++) { ctx.clearRect(0, 0, w, spec.h); spec.draw(ctx, w, spec.h, i / 30, state); }
    } else frame(t0);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible && !reduce) raf = requestAnimationFrame(frame);
    });
    io.observe(cv);
    const ro = new ResizeObserver(() => { if (Math.abs((cv.clientWidth || 0) - w) > 2) { size(); if (reduce) frame(performance.now()); } });
    ro.observe(cv);
    return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); };
  }, [spec]);
  if (!spec) return null;
  return (
    <figure className="b-figure">
      <canvas ref={ref} style={{ height: spec.h }} role="img" aria-label={caption} />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
