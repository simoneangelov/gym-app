"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/app/actions";

export function ForgotForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  return (
    <form action={action} className="card mt-8 space-y-3 p-5">
      <label className="block space-y-1">
        <span className="text-sm text-zinc-400">Email</span>
        <input name="email" type="email" required autoComplete="email" className="field" />
      </label>
      {state?.error && <p className="text-sm text-amber-400">{state.error}</p>}
      {state?.message && <p className="text-sm text-accent">{state.message}</p>}
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "…" : "Send reset link"}
      </button>
    </form>
  );
}
