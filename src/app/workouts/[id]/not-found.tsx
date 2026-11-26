import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card p-6 text-center">
      <p className="text-zinc-300">That workout doesn’t exist.</p>
      <Link href="/" className="btn-ghost mt-4">Back to workouts</Link>
    </div>
  );
}
