import { redirect } from "next/navigation";
import { SetupNotice } from "@/components/setup-notice";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { requireUser } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  if (!hasSupabaseEnv) return <SetupNotice />;
  const { userId } = await requireUser();
  if (userId) redirect("/");

  return (
    <div className="mx-auto max-w-sm pt-10">
      <h1 className="text-3xl font-bold tracking-tight">Track every rep.</h1>
      <p className="mt-2 text-zinc-400">Log workouts, sets and weights — see your progress over time.</p>
      <LoginForm />
    </div>
  );
}
