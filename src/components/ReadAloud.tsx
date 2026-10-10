import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Chapter } from "../content/types";
import { buildSegments, hebrewVoices, pickHebrewVoice, saveVoice, SPEEDS, voiceLabel } from "../narration";

const SPEED_KEY = "eil-speed";
const readSpeed = () => {
  try {
    const v = Number(localStorage.getItem(SPEED_KEY));
    return SPEEDS.includes(v) ? v : 1;
  } catch {
    return 1;
  }
};

const selectorFor = (target: string) =>
  target === "opening" ? ".chapter-opening" : target === "reflection" ? ".reflection" : target === "crystal" ? ".crystal" : `[data-block="${target.slice(1)}"]`;

/**
 * הקראת התחנה: מתחילה מהשאלה הפותחת, מדגישה את הקטע שמוקרא וגוללת אליו.
 * אפשר לדלג קדימה/אחורה, לשנות מהירות, ולגעת בכל פסקה כדי להתחיל ממנה.
 */
export function ReadAloud({ chapter, minutes }: { chapter: Chapter; minutes: number }) {
  const segments = useMemo(() => buildSegments(chapter), [chapter]);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [idx, setIdx] = useState(0);
  const [speed, setSpeed] = useState(readSpeed);
  const [noVoice, setNoVoice] = useState(false);
  const [voiceName, setVoiceName] = useState("");
  const run = useRef(0); // מזהה ריצה — כדי שאירוע onend ישן לא ימשיך ריצה שבוטלה
  const voice = useRef<SpeechSynthesisVoice | null>(null);
  const state = useRef({ idx: 0, speed });
  state.current.speed = speed;

  useEffect(() => {
    if (!supported) return;
    const load = () => {
      voice.current = pickHebrewVoice();
      setVoiceName(voiceLabel(voice.current));
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", load);
      run.current++;
      window.speechSynthesis.cancel();
      document.querySelectorAll(".is-reading").forEach((e) => e.classList.remove("is-reading"));
    };
  }, [supported]);

  const highlight = useCallback(
    (i: number) => {
      document.querySelectorAll(".is-reading").forEach((e) => e.classList.remove("is-reading"));
      const el = document.querySelector<HTMLElement>(selectorFor(segments[i].target));
      if (!el) return;
      el.classList.add("is-reading", "is-in");
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    [segments],
  );

  const speakFrom = useCallback(
    (i: number) => {
      if (!supported) return;
      const synth = window.speechSynthesis;
      const my = ++run.current;
      synth.cancel();
      if (i >= segments.length) {
        setPlaying(false);
        setIdx(segments.length - 1);
        return;
      }
      state.current.idx = i;
      setIdx(i);
      setPlaying(true);
      highlight(i);
      if (!voice.current) voice.current = pickHebrewVoice();
      setNoVoice(!voice.current);
      const u = new SpeechSynthesisUtterance(segments[i].text);
      u.lang = "he-IL";
      if (voice.current) u.voice = voice.current;
      u.rate = state.current.speed;
      u.pitch = 1;
      u.onend = () => {
        if (run.current !== my) return;
        const pause = segments[i + 1]?.target !== segments[i].target ? 450 : 220;
        setTimeout(() => run.current === my && speakFrom(i + 1), pause / state.current.speed);
      };
      // Chrome לפעמים מתעלם מ־speak מיד אחרי cancel
      setTimeout(() => run.current === my && synth.speak(u), 60);
    },
    [segments, supported, highlight],
  );

  const stop = useCallback(() => {
    run.current++;
    window.speechSynthesis?.cancel();
    setPlaying(false);
  }, []);

  const start = () => {
    setActive(true);
    speakFrom(state.current.idx);
  };
  const close = () => {
    stop();
    setActive(false);
    document.querySelectorAll(".is-reading").forEach((e) => e.classList.remove("is-reading"));
  };
  const toggle = () => (playing ? stop() : speakFrom(state.current.idx));
  const go = (d: number) => {
    const n = Math.max(0, Math.min(segments.length - 1, state.current.idx + d));
    if (playing) speakFrom(n);
    else {
      state.current.idx = n;
      setIdx(n);
      highlight(n);
    }
  };
  const cycleVoice = () => {
    const list = hebrewVoices();
    if (list.length < 2) return;
    const i = list.findIndex((v) => v.name === voice.current?.name);
    const nextV = list[(i + 1) % list.length];
    voice.current = nextV;
    saveVoice(nextV.name);
    setVoiceName(voiceLabel(nextV));
    if (playing) speakFrom(state.current.idx);
  };
  const cycleSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(next);
    state.current.speed = next;
    try {
      localStorage.setItem(SPEED_KEY, String(next));
    } catch {
      /* לא חובה */
    }
    if (playing) speakFrom(state.current.idx);
  };

  // נגיעה בפסקה בזמן הקראה — ממשיכים משם
  useEffect(() => {
    if (!active) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("button, a, textarea, input, summary, .readaloud")) return;
      const host = t.closest<HTMLElement>("[data-block], .chapter-opening, .reflection, .crystal");
      if (!host) return;
      const target = host.dataset.block !== undefined ? `b${host.dataset.block}` : host.classList.contains("chapter-opening") ? "opening" : host.classList.contains("reflection") ? "reflection" : "crystal";
      const n = segments.findIndex((s) => s.target === target);
      if (n >= 0) speakFrom(n);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [active, segments, speakFrom]);

  if (!supported) return null;

  return (
    <>
      {!active && (
        <button className="listen-btn" onClick={start}>
          <span className="listen-icon" aria-hidden>▶</span>
          האזנה לתחנה
          <small>(כ־{minutes} דקות)</small>
        </button>
      )}
      {active && (
        <div className="readaloud" role="region" aria-label="הקראה">
          <div className="ra-progress" aria-hidden>
            <span style={{ transform: `scaleX(${(idx + 1) / segments.length})` }} />
          </div>
          {noVoice && <p className="ra-note">לא נמצא קול עברי במכשיר הזה. ב־Chrome או Edge ההקראה נשמעת הכי טוב.</p>}
          <div className="ra-row">
            <button className="ra-btn" onClick={() => go(-1)} aria-label="הקטע הקודם">
              <svg viewBox="0 0 24 24" aria-hidden><path d="M17 6v12M6 6l9 6-9 6z" /></svg>
            </button>
            <button className="ra-btn ra-play" onClick={toggle} aria-label={playing ? "השהיה" : "המשך הקראה"}>
              {playing ? (
                <svg viewBox="0 0 24 24" aria-hidden><path d="M8 5v14M16 5v14" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden><path d="M17 5v14L6 12z" /></svg>
              )}
            </button>
            <button className="ra-btn" onClick={() => go(1)} aria-label="הקטע הבא">
              <svg viewBox="0 0 24 24" aria-hidden><path d="M7 6v12M18 6l-9 6 9 6z" /></svg>
            </button>
            <button className="ra-speed" dir="ltr" onClick={cycleSpeed} aria-label="מהירות הקראה">
              {speed}×
            </button>
            {hebrewVoices().length > 1 && (
              <button className="ra-voice" onClick={cycleVoice} aria-label="החלפת קול">{voiceName}</button>
            )}
            <span className="ra-count">{idx + 1}/{segments.length}</span>
            <button className="ra-close" onClick={close} aria-label="סגירת ההקראה">✕</button>
          </div>
        </div>
      )}
    </>
  );
}
