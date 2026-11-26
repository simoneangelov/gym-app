export function SetupNotice() {
  return (
    <div className="card space-y-3 p-5 text-sm text-zinc-300">
      <h1 className="text-lg font-semibold text-zinc-100">Connect Supabase</h1>
      <p>
        Copy <code className="text-accent">.env.example</code> to{" "}
        <code className="text-accent">.env.local</code> and fill in your Supabase project URL and
        publishable key, then run the SQL in{" "}
        <code className="text-accent">supabase/migrations/</code>.
      </p>
    </div>
  );
}
