import { ArrowRight, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { BackgroundLifeCanvas } from "../components/BackgroundLifeCanvas";

export function HomeScreen() {
  return (
    <main className="page-fade relative min-h-screen overflow-hidden">
      <BackgroundLifeCanvas className="absolute inset-0 h-full w-full opacity-80" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,6,6,0.9)_0%,rgba(6,6,6,0.65)_42%,rgba(6,6,6,0.85)_100%)]" />

      <section className="relative z-10 flex min-h-screen items-center px-8 py-16 xl:px-20">
        <div className="max-w-3xl">
          <p className="mb-6 text-xs uppercase tracking-[0.5em] text-cyan-200/70">
            The Kinetic Void
          </p>
          <h1 className="font-display text-6xl leading-none text-white sm:text-7xl xl:text-[7.5rem]">
            Game of Life
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
            A dark-field simulator for exploring how order, collapse, and emergence unfold one
            generation at a time.
          </p>

          <div className="mt-12 flex flex-wrap gap-4">
            <Link to="/worlds" className="control-button" data-accent="true">
              <ArrowRight size={18} />
              Start a Game
            </Link>
            <Link to="/about" className="control-button">
              <Info size={18} />
              About
            </Link>
          </div>

          <div className="mt-16 grid max-w-2xl grid-cols-3 gap-6 text-sm text-slate-400">
            <div>
              <p className="font-display text-3xl text-white">1</p>
              <p className="mt-2 uppercase tracking-[0.3em]">Living system</p>
            </div>
            <div>
              <p className="font-display text-3xl text-white">∞</p>
              <p className="mt-2 uppercase tracking-[0.3em]">Emergent outcomes</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
