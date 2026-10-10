import { Component, StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

/** אם משהו נשבר (למשל נתונים ישנים בדפדפן), לא מסך לבן אלא הסבר וכפתור איפוס */
class Safe extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="chapter-missing" style={{ padding: "80px 24px" }}>
        <p>משהו השתבש בטעינה.</p>
        <button
          className="btn-ghost"
          onClick={() => {
            try {
              localStorage.removeItem("eil-v2");
              localStorage.removeItem("eil-v2-review");
            } catch {
              /* לא חובה */
            }
            location.href = location.pathname + "#/journey";
            location.reload();
          }}
        >
          לטעון מחדש
        </button>
      </div>
    );
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Safe>
      <App />
    </Safe>
  </StrictMode>,
);
