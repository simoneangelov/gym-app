export default function Loading() {
  return (
    <div className="space-y-3" aria-busy="true">
      <div className="h-8 w-40 animate-pulse rounded-lg bg-zinc-900" />
      <div className="card h-24 animate-pulse" />
      <div className="card h-24 animate-pulse" />
    </div>
  );
}
