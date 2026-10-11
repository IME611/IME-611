import { useEffect, useRef } from "react";

/**
 * איורים מונפשים קטנים, מצוירים בקוד (canvas). בלי קבצים חיצוניים.
 * כל איור: רץ רק כשהוא על המסך, ונעצר על פריים יציב כשהמשתמש ביקש פחות תנועה.
 */
export type FigureKind = "wave" | "chladni" | "sync" | "slits" | "expand" | "path" | "dna" | "leaf"
  | "keyhole" | "eeg" | "melatonin" | "detour" | "orbit" | "mosaic";

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


const label = (c: CanvasRenderingContext2D, txt: string, x: number, y: number, color = INK, size = 12, align: CanvasTextAlign = "center") => {
  c.save(); c.font = `${size}px system-ui, -apple-system, sans-serif`; c.fillStyle = color; c.textAlign = align;
  try { (c as any).direction = "rtl"; } catch { /* */ }
  c.fillText(txt, x, y); c.restore();
};

/** חור המנעול: זרם עצום של אותות, ורק מעטים עוברים דרך החור */
const keyhole: Spec = {
  h: 230,
  init: (w, h) => ({ p: Array.from({ length: 260 }, () => ({ x: rnd(w * 0.5, w), y: rnd(10, h - 30), v: rnd(40, 90), through: false })) }),
  draw(c, w, h, t, s) {
    const wallX = w * 0.42, cy = (h - 30) / 2 + 6;
    const dt = Math.min(0.05, t - (s.last ?? t)); s.last = t;
    // קיר עם חור מנעול
    c.fillStyle = "rgba(38,34,28,.82)"; c.fillRect(wallX - 7, 0, 14, h - 30);
    c.globalCompositeOperation = "destination-out";
    c.beginPath(); c.arc(wallX, cy - 8, 7, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(wallX - 4, cy - 4); c.lineTo(wallX + 4, cy - 4); c.lineTo(wallX + 6, cy + 14); c.lineTo(wallX - 6, cy + 14); c.closePath(); c.fill();
    c.globalCompositeOperation = "source-over";
    let passed = 0;
    for (const q of s.p) {
      q.x -= q.v * dt;
      if (!q.through && q.x <= wallX + 8 && q.x > wallX - 8) {
        if (Math.abs(q.y - (cy + 2)) < 9) q.through = true;
        else { q.x = rnd(w * 0.75, w + 40); q.y = rnd(10, h - 30); continue; }
      }
      if (q.x < -10) { q.x = rnd(w * 0.75, w + 40); q.y = rnd(10, h - 30); q.through = false; }
      if (q.through) passed++;
      c.fillStyle = q.through ? GOLD : INK_SOFT;
      c.beginPath(); c.arc(q.x, q.y, q.through ? 3 : 2, 0, Math.PI * 2); c.fill();
    }
    label(c, "כל מה שהחושים קולטים", w * 0.72, h - 10, INK, 12);
    label(c, "מה שמגיע למודע", w * 0.18, h - 10, GOLD, 12);
  },
};

/** גלי מוח: עיניים פקוחות מול עיניים עצומות. באלפא הקצב מסודר וגדול יותר */
const eeg: Spec = {
  h: 190,
  init: () => ({ buf: [] as number[], ph: 0, last: 0, noise: 0 }),
  draw(c, w, h, t, s) {
    const closed = Math.floor(t / 5) % 2 === 1;
    const dt = Math.min(0.05, t - (s.last || t)); s.last = t;
    const steps = Math.max(1, Math.round(dt * 240));
    for (let i = 0; i < steps; i++) {
      const tt = t - dt + (i / steps) * dt;
      s.noise = s.noise * 0.6 + rnd(-1, 1) * 0.4;
      const v = closed
        ? Math.sin(tt * 2 * Math.PI * 10) * 0.85 + s.noise * 0.2
        : (Math.sin(tt * 2 * Math.PI * 21) * 0.2 + Math.sin(tt * 2 * Math.PI * 27 + 1) * 0.15 + s.noise * 0.35);
      s.buf.push(v);
    }
    const max = Math.ceil(w * 1.2);
    if (s.buf.length > max) s.buf.splice(0, s.buf.length - max);
    const mid = h / 2 - 8, amp = 46;
    c.strokeStyle = "rgba(38,34,28,.12)"; c.lineWidth = 1;
    c.beginPath(); c.moveTo(0, mid); c.lineTo(w, mid); c.stroke();
    c.strokeStyle = closed ? EMERALD : INK; c.lineWidth = 1.6; c.beginPath();
    const n = s.buf.length, xs = w / max;
    for (let i = 0; i < n; i++) { const x = w - (n - i) * xs, y = mid - s.buf[i] * amp; i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.stroke();
    label(c, closed ? "עיניים עצומות: אלפא, כעשר פעימות בשנייה" : "עיניים פקוחות: קצב מהיר, קטן ולא מסודר", w / 2, h - 12, closed ? EMERALD : INK, 13);
  },
};

/** מלטונין: יממה אחת. כשהאור יורד, ההורמון עולה */
const melatonin: Spec = {
  h: 220,
  draw(c, w, h, t) {
    const pad = 22, top = 26, bot = h - 46, cw = w - pad * 2;
    // ציר: 08:00 ← 08:00 (מימין לשמאל, כמו קריאה בעברית)
    const hourAt = (x: number) => (8 + ((pad + cw - x) / cw) * 24) % 24;
    const xAt = (hr: number) => pad + cw - (((hr - 8 + 24) % 24) / 24) * cw;
    const isDark = (hr: number) => hr >= 19.5 || hr < 6.5;
    // רקע יום/לילה
    for (let x = pad; x < pad + cw; x += 2) {
      const hr = hourAt(x);
      c.fillStyle = isDark(hr) ? "rgba(22,30,60,.16)" : "rgba(230,196,58,.14)";
      c.fillRect(x, top, 2, bot - top);
    }
    // עקומת מלטונין: מתחילה לעלות כשעתיים אחרי החשכה, שיא לפנות בוקר
    const mel = (hr: number) => { const d = ((hr - 3 + 36) % 24) - 12; return Math.exp(-(d * d) / 9) * (hr >= 21 || hr < 8 ? 1 : 0.05); };
    c.strokeStyle = "#6d4c8a"; c.lineWidth = 2.4; c.beginPath();
    for (let x = pad; x <= pad + cw; x += 2) { const y = bot - mel(hourAt(x)) * (bot - top - 18); x === pad ? c.moveTo(x, y) : c.lineTo(x, y); }
    c.stroke();
    // הסמן שנע לאורך היממה
    const cyc = (t % 12) / 12, hr = (8 + cyc * 24) % 24, x = xAt(hr);
    c.strokeStyle = GOLD; c.lineWidth = 1.5; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(x, top); c.lineTo(x, bot); c.stroke(); c.setLineDash([]);
    c.fillStyle = "#6d4c8a"; c.beginPath(); c.arc(x, bot - mel(hr) * (bot - top - 18), 5, 0, Math.PI * 2); c.fill();
    // שמש או ירח
    if (isDark(hr)) { c.fillStyle = "#c9cfe0"; c.beginPath(); c.arc(x, top - 12, 7, 0, Math.PI * 2); c.fill(); c.fillStyle = "rgba(250,248,242,1)"; c.beginPath(); c.arc(x + 3, top - 14, 6, 0, Math.PI * 2); c.fill(); }
    else { c.fillStyle = "#e6c43a"; c.beginPath(); c.arc(x, top - 12, 7, 0, Math.PI * 2); c.fill(); }
    const hh = Math.floor(hr), mm = Math.floor((hr - hh) * 60 / 15) * 15;
    label(c, `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`, x, bot + 16, INK, 11);
    label(c, "מלטונין בדם", pad + cw, h - 8, "#6d4c8a", 12, "right");
    label(c, "יום  ·  לילה", pad, h - 8, INK_SOFT, 12, "left");
  },
};

/** דרך עוקפת: כשהשביל נחסם, האות לומד מסלול חדש, וכל מעבר מחזק אותו */
const detour: Spec = {
  h: 230,
  init: (w, h) => {
    const A = { x: w - 28, y: h / 2 - 10 }, B = { x: 28, y: h / 2 - 10 };
    const main = [A, { x: w * 0.68, y: h / 2 - 6 }, { x: w * 0.5, y: h / 2 - 12 }, { x: w * 0.32, y: h / 2 - 8 }, B];
    const alt = [A, { x: w * 0.74, y: h * 0.24 }, { x: w * 0.5, y: h * 0.13 }, { x: w * 0.27, y: h * 0.22 }, B];
    const extra = Array.from({ length: 14 }, () => ({ x: rnd(40, w - 40), y: rnd(20, h - 50) }));
    return { A, B, main, alt, extra, sig: [] as any[], lastSpawn: -1, altUse: 0, cycle: -1 };
  },
  draw(c, w, h, t, s) {
    const T = t % 16, cycle = Math.floor(t / 16);
    if (cycle !== s.cycle) { s.cycle = cycle; s.altUse = 0; s.sig = []; }
    const blocked = T > 4.5;
    const along = (pts: any[], f: number) => {
      const seg = (pts.length - 1) * f, i = Math.min(pts.length - 2, Math.floor(seg)), k = seg - i;
      return { x: pts[i].x + (pts[i + 1].x - pts[i].x) * k, y: pts[i].y + (pts[i + 1].y - pts[i].y) * k };
    };
    const line = (pts: any[], width: number, col: string) => { c.strokeStyle = col; c.lineWidth = width; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.stroke(); };
    for (const e of s.extra) { c.fillStyle = "rgba(38,34,28,.16)"; c.beginPath(); c.arc(e.x, e.y, 3, 0, Math.PI * 2); c.fill(); }
    line(s.main, blocked ? 1.5 : 4, blocked ? "rgba(38,34,28,.18)" : "rgba(0,73,47,.55)");
    line(s.alt, 1 + Math.min(5, s.altUse * 0.45), `rgba(168,131,42,${0.25 + Math.min(0.6, s.altUse * 0.06)})`);
    for (const p of [...s.main.slice(1, -1), ...s.alt.slice(1, -1)]) { c.fillStyle = INK_SOFT; c.beginPath(); c.arc(p.x, p.y, 4, 0, Math.PI * 2); c.fill(); }
    // נקודת החסימה
    if (blocked) {
      const m = s.main[2]; c.strokeStyle = "#b5523b"; c.lineWidth = 3;
      c.beginPath(); c.moveTo(m.x - 9, m.y - 9); c.lineTo(m.x + 9, m.y + 9); c.moveTo(m.x + 9, m.y - 9); c.lineTo(m.x - 9, m.y + 9); c.stroke();
    }
    // אותות
    if (T - s.lastSpawn > 0.8 || T < s.lastSpawn) { s.lastSpawn = T; s.sig.push({ born: t, route: blocked && T > 6 ? "alt" : "main" }); }
    s.sig = s.sig.filter((g: any) => t - g.born < 2.2);
    for (const g of s.sig) {
      const f = (t - g.born) / 2;
      if (g.route === "main" && blocked && f > 0.5) continue;
      if (f >= 1) { if (g.route === "alt" && !g.done) { g.done = true; s.altUse++; } continue; }
      const p = along(g.route === "alt" ? s.alt : s.main, f);
      c.fillStyle = g.route === "alt" ? GOLD : EMERALD; c.beginPath(); c.arc(p.x, p.y, 4.5, 0, Math.PI * 2); c.fill();
    }
    for (const [p, txt] of [[s.A, "כוונה"], [s.B, "תנועה"]] as const) {
      c.fillStyle = INK; c.beginPath(); c.arc(p.x, p.y, 7, 0, Math.PI * 2); c.fill();
      label(c, txt, p.x, p.y + 24, INK, 12);
    }
    label(c, blocked ? (T > 6 ? "מסלול חדש מתחזק עם כל מעבר" : "השביל נחסם") : "השביל הרגיל", w / 2, h - 10, blocked ? GOLD : EMERALD, 13);
  },
};

/** התותח של ניוטון: אותו כוח שמפיל אבן, וכשהמהירות מספיקה, הוא מקיף את כדור הארץ */
const orbit: Spec = {
  h: 300,
  init: () => ({ shots: [] as any[], next: 0, k: 0, last: 0 }),
  draw(c, w, h, t, s) {
    const cx = w / 2, cy = h / 2 - 2, R = Math.min(w, h) * 0.2, top = R + 16, GM = 1;
    const vc = Math.sqrt(GM / top);
    const speeds = [0.45, 0.72, 0.9, 1.0];
    if (t >= s.next) {
      if (s.k % speeds.length === 0) s.shots = [];
      const v = speeds[s.k % speeds.length] * vc;
      s.shots.push({ x: 0, y: -top, vx: -v, vy: 0, trail: [] as number[][], dead: false });
      s.k++; s.next = t + (s.k % speeds.length === 0 ? 6 : 2.6);
    }
    const dt = Math.min(0.05, t - (s.last || t)); s.last = t;
    // כדור הארץ
    c.fillStyle = "rgba(0,73,47,.18)"; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "rgba(0,73,47,.5)"; c.lineWidth = 1.5; c.stroke();
    // הר ותותח
    c.fillStyle = INK_SOFT; c.beginPath(); c.moveTo(cx - 12, cy - R + 2); c.lineTo(cx, cy - top); c.lineTo(cx + 12, cy - R + 2); c.closePath(); c.fill();
    const sub = 40, step = (dt * 8 * Math.sqrt(top * top * top)) / sub / 2.2;
    for (const b of s.shots) {
      if (!b.dead) for (let i = 0; i < sub; i++) {
        const r = Math.hypot(b.x, b.y), a = GM / (r * r * r);
        b.vx -= b.x * a * step; b.vy -= b.y * a * step; b.x += b.vx * step; b.y += b.vy * step;
        if (Math.hypot(b.x, b.y) <= R) { b.dead = true; break; }
      }
      if (b.trail.length === 0 || Math.hypot(b.trail[b.trail.length - 1][0] - b.x, b.trail[b.trail.length - 1][1] - b.y) > 2) b.trail.push([b.x, b.y]);
      if (b.trail.length > 900) b.trail.shift();
      c.strokeStyle = GOLD_SOFT; c.lineWidth = 1.6; c.beginPath();
      b.trail.forEach((p: number[], i: number) => (i ? c.lineTo(cx + p[0], cy + p[1]) : c.moveTo(cx + p[0], cy + p[1]))); c.stroke();
      c.fillStyle = GOLD; c.beginPath(); c.arc(cx + b.x, cy + b.y, 3.5, 0, Math.PI * 2); c.fill();
    }
    label(c, "יותר מהירות, אותה נפילה. עד שהיא לא נגמרת", w / 2, h - 8, INK, 12);
  },
};

/** פסיפס: מקרוב רואים אבנים. מרחוק, פנים */
const mosaic: Spec = {
  h: 280,
  init: () => {
    const N = 34, tiles: string[] = [];
    const pal = { bg: ["#c9b98f", "#bfae84", "#d3c49c"], face: ["#e2b97a", "#d8ad6c", "#e8c389"], ink: ["#3a3026", "#2f271f", "#4a3d2f"], gold: ["#a8832a", "#b8913a"] };
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = (i + 0.5) / N - 0.5, y = (j + 0.5) / N - 0.5, r = Math.hypot(x, y);
      let set = pal.bg;
      if (r < 0.36) set = pal.face;
      if (Math.abs(r - 0.36) < 0.022) set = pal.gold;
      if (Math.hypot(x + 0.13, y + 0.09) < 0.045 || Math.hypot(x - 0.13, y + 0.09) < 0.045) set = pal.ink;
      const sm = Math.hypot(x, y + 0.02); if (y > 0.04 && Math.abs(sm - 0.2) < 0.025 && Math.abs(x) < 0.17) set = pal.ink;
      tiles.push(Math.random() < 0.06 ? pal.bg[Math.floor(Math.random() * 3)] : set[Math.floor(Math.random() * set.length)]);
    }
    return { N, tiles };
  },
  draw(c, w, h, t, s) {
    const T = t % 12;
    const e = T < 2 ? 0 : T < 6 ? (T - 2) / 4 : T < 9.5 ? 1 : 1 - (T - 9.5) / 2.5;
    const ease = e * e * (3 - 2 * e);
    const zoom = 7 - 6 * ease;
    const size = Math.min(w - 20, h - 30) * zoom, fx = 0.38, fy = 0.36;
    const ox = w / 2 - size * fx - (size * (0.5 - fx)) * ease, oy = (h - 24) / 2 - size * fy - (size * (0.5 - fy)) * ease;
    const cell = size / s.N, gap = Math.max(0.6, cell * 0.08);
    c.save(); c.beginPath(); c.rect(0, 0, w, h - 24); c.clip();
    for (let j = 0; j < s.N; j++) for (let i = 0; i < s.N; i++) {
      const x = ox + i * cell, y = oy + j * cell;
      if (x > w || y > h || x + cell < 0 || y + cell < 0) continue;
      c.fillStyle = s.tiles[j * s.N + i]; c.fillRect(x + gap, y + gap, cell - gap * 2, cell - gap * 2);
    }
    c.restore();
    label(c, ease < 0.5 ? "מקרוב: אבנים" : "צעד אחורה: תמונה", w / 2, h - 6, INK, 13);
  },
};

const SPECS: Record<FigureKind, Spec> = { wave, chladni, sync, slits, expand, path, dna, leaf, keyhole, eeg, melatonin, detour, orbit, mosaic };

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
