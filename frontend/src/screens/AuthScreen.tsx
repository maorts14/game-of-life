import { ArrowLeft, ArrowRight, Cloud, LogIn, UserPlus } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { BackgroundLifeCanvas } from "../components/BackgroundLifeCanvas";
import { ResponsiveIconButton } from "../components/ResponsiveIconButton";
import { useAuth } from "../providers/AuthProvider";

interface AuthScreenProps {
  mode: "login" | "signup";
}

export function AuthScreen({ mode }: AuthScreenProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const returnTo = useMemo(() => {
    const state = location.state as { from?: string } | null;
    return state?.from ?? "/worlds?mode=cloud";
  }, [location.state]);

  if (auth.status === "authenticated") {
    return <Navigate to={returnTo} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setMessage(null);

    try {
      if (mode === "login") {
        await auth.login(email, password);
        navigate(returnTo, { replace: true });
      } else {
        const result = await auth.signup(email, password);

        if (result.requiresEmailConfirmation) {
          setMessage("Check your inbox to confirm your account, then sign in to open Cloud mode.");
        } else {
          navigate(returnTo, { replace: true });
        }
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to continue.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-fade relative min-h-[var(--app-stable-vh)] overflow-hidden px-4 py-6 sm:px-6 sm:py-8 xl:px-16 xl:py-10">
      <BackgroundLifeCanvas
        className="absolute inset-0 h-full w-full opacity-55"
        cellSize={20}
        density={0.08}
        tickMs={220}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,6,6,0.88)_0%,rgba(6,6,6,0.74)_42%,rgba(6,6,6,0.92)_100%)]" />

      <div className="relative z-10 mx-auto flex min-h-[calc(var(--app-stable-vh)-3rem)] max-w-6xl items-center gap-10 xl:min-h-[calc(var(--app-stable-vh)-5rem)] xl:grid xl:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden xl:flex xl:flex-col xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-200/70">Cloud Access</p>
            <h1 className="font-display mt-4 text-6xl leading-none text-white">
              {mode === "login" ? "Resume your online lab." : "Create your cloud lab."}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Local worlds stay on this device. Cloud worlds follow your account so your saved
              grids, patterns, and preferences travel with you.
            </p>
          </div>

          <div className="grid max-w-lg grid-cols-2 gap-4 text-sm text-slate-400">
            <div className="panel ghost-border rounded-[24px] px-5 py-5">
              <Cloud size={20} className="text-cyan-200/80" />
              <p className="mt-4 font-display text-2xl text-white">Cloud Worlds</p>
              <p className="mt-2 leading-7">Create a separate online library without disturbing your existing local vault.</p>
            </div>
            <div className="panel ghost-border rounded-[24px] px-5 py-5">
              <ArrowRight size={20} className="text-cyan-200/80" />
              <p className="mt-4 font-display text-2xl text-white">Autosave</p>
              <p className="mt-2 leading-7">Gameplay stays responsive in the browser while snapshots and cell patches sync behind the scenes.</p>
            </div>
          </div>
        </section>

        <section className="panel ghost-border mx-auto w-full max-w-xl rounded-[28px] px-6 py-7 sm:px-8 sm:py-8 xl:rounded-[32px] xl:px-10 xl:py-10">
          <div className="flex items-center justify-between gap-3">
            <ResponsiveIconButton
              to="/worlds"
              icon={<ArrowLeft size={16} />}
              mobileLabel="Back"
              desktopLabel="Back to Worlds"
              className="!min-w-0 !gap-0.5 !px-0.5 !py-1"
            />
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">
              {mode === "login" ? "Sign In" : "Create Account"}
            </p>
          </div>

          <h2 className="font-display mt-6 text-4xl text-white sm:text-5xl">
            {mode === "login" ? "Open Cloud Mode" : "Start syncing worlds"}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-400 sm:text-base">
            {mode === "login"
              ? "Use your account to access online worlds, cloud patterns, and synced playback preferences."
              : "Create an account to keep a separate online library of worlds and patterns alongside your local data."}
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm uppercase tracking-[0.2em] text-slate-400">Email</span>
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
                placeholder="you@example.com"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm uppercase tracking-[0.2em] text-slate-400">Password</span>
              <input
                required
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
                placeholder="Minimum 8 characters"
              />
            </label>

            {errorMessage ? (
              <p className="rounded-[18px] border border-red-400/22 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {errorMessage}
              </p>
            ) : null}

            {message ? (
              <p className="rounded-[18px] border border-cyan-300/20 bg-cyan-300/[0.08] px-4 py-3 text-sm text-cyan-100">
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              className="control-button mt-2 w-full justify-center py-3"
              data-accent="true"
              disabled={isSubmitting}
            >
              {mode === "login" ? <LogIn size={18} /> : <UserPlus size={18} />}
              {isSubmitting ? "Working..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-400">
            {mode === "login" ? "Need an account?" : "Already have an account?"}{" "}
            <Link
              to={mode === "login" ? "/signup" : "/login"}
              state={{ from: returnTo }}
              className="text-cyan-200 transition hover:text-white"
            >
              {mode === "login" ? "Create one" : "Sign in instead"}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
