import { useEffect, useState } from "react";
import { Welcome } from "./screens/Welcome";
import { Journey } from "./screens/Journey";
import { ChapterScreen } from "./screens/Chapter";
import { Space } from "./screens/Space";
import { Tools } from "./screens/Tools";
import { Inquiries } from "./screens/Inquiries";

function useRoute() {
  const read = () => window.location.hash.replace(/^#\/?/, "");
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => {
      setRoute(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}

function Header({ route }: { route: string }) {
  return (
    <header className="topbar">
      <a href="#/journey" className="topbar-brand" aria-label="המסע">E·I·L</a>
      <nav className="topbar-nav">
        <a href="#/journey" className={route === "journey" ? "is-active" : ""}>המסע</a>
        <a href="#/tools" className={route === "tools" ? "is-active" : ""}>כלים</a>
        <a href="#/inquiries" className={route === "inquiries" ? "is-active" : ""}>חקירות</a>
        <a href="#/space" className={route === "space" ? "is-active" : ""}>המרחב שלי</a>
      </nav>
    </header>
  );
}

export function App() {
  const route = useRoute();
  if (route === "") return <Welcome />;
  const [screen, param] = route.split("/");
  return (
    <>
      <Header route={screen} />
      <main className="page">
        {screen === "chapter" && param ? <ChapterScreen key={param} id={param} /> : screen === "space" ? <Space /> : screen === "tools" ? <Tools /> : screen === "inquiries" ? <Inquiries /> : <Journey />}
      </main>
    </>
  );
}
