import { SetupNotice } from "@/components/setup-notice";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { ResetForm } from "./reset-form";

// Reached from the password-reset email via /auth/confirm, which signs the
// user in first. Signed-out visitors are sent to /login by the proxy.
export default function ResetPasswordPage() {
  if (!hasSupabaseEnv) return <SetupNotice />;
  return (
    <div className="mx-auto max-w-sm pt-10">
      <h1 className="text-3xl font-bold tracking-tight">Choose a new password</h1>
      <ResetForm />
    </div>
  );
}
