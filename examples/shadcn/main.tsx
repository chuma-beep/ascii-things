import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import { DitherCard, KoiCard, SurfaceCard } from "./components/cards";

function App() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-14">
      <header className="flex flex-col gap-3">
        <span className="text-[10px] uppercase tracking-[0.24em] text-accent">
          Design system recipe
        </span>
        <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
          ascii-things inside shadcn/ui
        </h1>
        <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
          The scene wrappers are canvases. shadcn owns the card, the controls, and the spacing; the
          canvas fills a sized box. This page runs on Vite and Tailwind, with the component source
          copied in the same way shadcn copies components.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <KoiCard />
        <DitherCard />
        <div className="md:col-span-2">
          <SurfaceCard />
        </div>
      </div>

      <footer className="border-t border-border pt-6 text-[11px] text-muted-foreground">
        <a className="text-accent underline-offset-4 hover:underline" href="/">
          ascii-things
        </a>{" "}
        × shadcn/ui
      </footer>
    </div>
  );
}

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
