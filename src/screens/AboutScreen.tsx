import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { BackgroundLifeCanvas } from "../components/BackgroundLifeCanvas";

export function AboutScreen() {
  return (
    <main className="page-fade relative min-h-screen overflow-hidden px-8 py-10 xl:px-16">
      <BackgroundLifeCanvas
        className="absolute inset-0 h-full w-full opacity-55"
        cellSize={20}
        density={0.08}
        tickMs={220}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,6,6,0.82)_0%,rgba(6,6,6,0.72)_45%,rgba(6,6,6,0.9)_100%)]" />
      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl grid-cols-1 gap-10 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="flex flex-col justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-200/70">The Protocol</p>
            <h1 className="font-display mt-6 text-6xl leading-none text-white">About this simulator</h1>
          </div>

          <Link to="/" className="control-button w-fit">
            <ArrowLeft size={18} />
            Return Home
          </Link>
        </div>

        <div className="panel ghost-border rounded-[32px] px-8 py-10 xl:px-12">
          <section>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">The Origin</p>
            <p className="mt-4 text-lg leading-8 text-slate-200">
              Conway&apos;s Game of Life is a zero-player cellular automaton. Once an initial state is
              configured, each generation evolves purely from local neighbor rules, producing motion,
              stasis, and surprising structures from simple binary cells.
            </p>
          </section>

          <section className="mt-10">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">The Engine</p>
            <p className="mt-4 text-lg leading-8 text-slate-200">
              This app lets you create worlds, paint cells directly on the simulation canvas, step
              one generation at a time, run continuous playback, randomize the board, and save each
              world locally in your browser.
            </p>
          </section>

          <section className="mt-10">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Observer Node</p>
            <a
              href="mailto:developer@example.com"
              className="mt-4 inline-flex text-2xl text-cyan-200 transition hover:text-white"
            >
              developer@example.com
            </a>
          </section>
        </div>
      </div>
    </main>
  );
}
