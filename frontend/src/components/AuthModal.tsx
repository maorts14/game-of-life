import { FormEvent, useState } from "react";
import { useAuth } from "../auth/AuthProvider";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (mode === "signin") {
        await signIn({ email, password });
      } else {
        await signUp({ email, password });
      }

      setEmail("");
      setPassword("");
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="panel ghost-border w-full max-w-lg rounded-[28px] px-8 py-8"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">Cloud Access</p>
        <h2 className="font-display mt-3 text-4xl text-white">
          {mode === "signin" ? "Sign in to sync" : "Create account"}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Local worlds stay available without login. Sign in when you want cloud persistence and sync.
        </p>

        <div className="mt-8 flex rounded-full border border-white/10 bg-white/[0.03] p-1">
          <button
            type="button"
            className={`flex-1 rounded-full px-4 py-2 text-sm transition ${
              mode === "signin" ? "bg-cyan-300/15 text-cyan-100" : "text-slate-400"
            }`}
            onClick={() => setMode("signin")}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 rounded-full px-4 py-2 text-sm transition ${
              mode === "signup" ? "bg-cyan-300/15 text-cyan-100" : "text-slate-400"
            }`}
            onClick={() => setMode("signup")}
          >
            Sign Up
          </button>
        </div>

        <div className="mt-8 space-y-6">
          <label className="block">
            <span className="mb-2 block text-sm uppercase tracking-[0.2em] text-slate-400">
              Email
            </span>
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full border-b border-cyan-300/40 bg-transparent px-0 py-3 text-lg text-white outline-none"
              placeholder="you@example.com"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm uppercase tracking-[0.2em] text-slate-400">
              Password
            </span>
            <input
              required
              type="password"
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border-b border-cyan-300/40 bg-transparent px-0 py-3 text-lg text-white outline-none"
              placeholder="Minimum 6 characters"
            />
          </label>
        </div>

        {errorMessage ? <p className="mt-5 text-sm text-red-200">{errorMessage}</p> : null}

        <div className="mt-10 flex justify-end gap-4">
          <button type="button" className="control-button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="control-button" data-accent="true" disabled={isSubmitting}>
            {isSubmitting ? "Working..." : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </div>
      </form>
    </div>
  );
}
