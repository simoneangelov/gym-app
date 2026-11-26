"use client";

import { useActionState } from "react";
import { updatePassword } from "@/app/actions";

export function ResetForm() {
  const [state, action, pending] = useActionState(updatePassword, undefined);

  return (
    <form action={action} className="card mt-8 space-y-3 p-5">
      <label className="block space-y-1">
        <span className="text-sm text-zinc-400">New password</span>
        <input name="password" type="password" required minLength={6} autoComplete="new-password" className="field" />
      </label>
      <label className="block space-y-1">
        <span className="text-sm text-zinc-400">Confirm new password</span>
        <input name="confirm" type="password" required minLength={6} autoComplete="new-password" className="field" />
      </label>
      {state?.error && <p className="text-sm text-amber-400">{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "…" : "Save new password"}
      </button>
    </form>
  );
}
