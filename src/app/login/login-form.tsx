"use client";

import { useActionState, useState } from "react";
import { signIn, signUp } from "@/app/actions";

export function LoginForm() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [inState, inAction, inPending] = useActionState(signIn, undefined);
  const [upState, upAction, upPending] = useActionState(signUp, undefined);
  const state = mode === "in" ? inState : upState;
  const pending = mode === "in" ? inPending : upPending;

  return (
    <form action={mode === "in" ? inAction : upAction} className="card mt-8 space-y-3 p-5">
      <label className="block space-y-1">
        <span className="text-sm text-zinc-400">Email</span>
        <input name="email" type="email" required autoComplete="email" className="field" />
      </label>
      <label className="block space-y-1">
        <span className="text-sm text-zinc-400">Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete={mode === "in" ? "current-password" : "new-password"}
          className="field"
        />
      </label>
      {state?.error && <p className="text-sm text-amber-400">{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "…" : mode === "in" ? "Sign in" : "Create account"}
      </button>
      <button
        type="button"
        onClick={() => setMode(mode === "in" ? "up" : "in")}
        className="w-full text-center text-sm text-zinc-400 hover:text-zinc-200"
      >
        {mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}
      </button>
    </form>
  );
}
