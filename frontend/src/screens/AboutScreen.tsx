import { ArrowLeft } from "lucide-react";
import { BackgroundLifeCanvas } from "../components/BackgroundLifeCanvas";
import { ResponsiveIconButton } from "../components/ResponsiveIconButton";

export function AboutScreen() {
  return (
    <main className="page-fade relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 sm:py-8 xl:px-16 xl:py-10">
      <BackgroundLifeCanvas
        className="absolute inset-0 h-full w-full opacity-55"
        cellSize={20}
        density={0.08}
        tickMs={220}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,6,6,0.82)_0%,rgba(6,6,6,0.72)_45%,rgba(6,6,6,0.9)_100%)]" />
      <div className="absolute left-4 top-4 z-20 sm:hidden">
        <ResponsiveIconButton
          to="/"
          icon={<ArrowLeft size={18} />}
          mobileLabel="Home"
          desktopLabel="Return Home"
        />
      </div>
      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl grid-cols-1 gap-8 pt-14 sm:pt-0 xl:min-h-[calc(100vh-5rem)] xl:gap-10 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="flex flex-col justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-200/70">The Protocol</p>
            <h1 className="font-display mt-4 text-5xl leading-none text-white sm:mt-6 sm:text-6xl">About this simulator</h1>
          </div>

          <ResponsiveIconButton
            to="/"
            icon={<ArrowLeft size={18} />}
            mobileLabel="Home"
            desktopLabel="Return Home"
            className="hidden w-fit self-start sm:flex"
          />
        </div>

        <div className="panel ghost-border rounded-[28px] px-5 py-6 sm:rounded-[32px] sm:px-7 sm:py-8 xl:px-12 xl:py-10">
          <section>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">The Origin</p>
            <p className="mt-4 text-lg leading-8 text-slate-200">
              Conway&apos;s Game of Life is a zero-player cellular automaton. Once an initial state is
              configured, each generation evolves purely from local neighbor rules, producing motion,
              stasis, and surprising structures from simple binary cells.
            </p>
          </section>

          <section className="mt-10">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">The Rules</p>
            <div className="mt-4 space-y-1 text-lg leading-8 text-slate-200">
              <p>Each cell checks its 8 surrounding neighbors and updates its state by the amount of living cells around him.</p>
              <p>- Less than 2 live: dies from underpopulation.</p>
              <p>- 2 or 3 live neighbors: survives into the next generation.</p>
              <p>- More than 3 live neighbors dies from overpopulation.</p>
              <p>- Any dead cell with exactly 3 live neighbors becomes alive through reproduction.</p>
            </div>
          </section>

          <section className="mt-10">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">The Engine</p>
            <p className="mt-4 text-lg leading-8 text-slate-200">
              This app lets you create worlds, paint cells or add patterns directly on the simulation canvas, randomize the board, step
              one generation at a time and run continuous playback.
            </p>
          </section>

          <section className="mt-10">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Contact me</p>
            <a
              href="mailto:maorts14@gmail.com"
              className="mt-4 inline-flex text-2xl text-cyan-200 transition hover:text-white"
            >
              maorts14@gmail.com
            </a>
          </section>
        </div>
      </div>
    </main>
  );
}
