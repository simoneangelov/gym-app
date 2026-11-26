import Link from "next/link";
import { SetupNotice } from "@/components/setup-notice";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { ForgotForm } from "./forgot-form";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>;
}) {
  if (!hasSupabaseEnv) return <SetupNotice />;
  const { expired } = await searchParams;

  return (
    <div className="mx-auto max-w-sm pt-10">
      <h1 className="text-3xl font-bold tracking-tight">Reset your password</h1>
      <p className="mt-2 text-zinc-400">
        {expired
          ? "That reset link has expired or was already used. Request a new one below."
          : "Enter your account email and we'll send you a link to choose a new password."}
      </p>
      <ForgotForm />
      <Link href="/login" className="mt-4 block text-center text-sm text-zinc-400 hover:text-zinc-200">
        Back to sign in
      </Link>
    </div>
  );
}
