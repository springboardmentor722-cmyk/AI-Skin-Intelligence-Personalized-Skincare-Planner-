import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-6">
      <h1 className="text-5xl font-display font-semibold text-ocean-500">404</h1>
      <p className="text-ink-secondary max-w-sm">
        This page doesn't exist. It might have moved, or the link might be wrong.
      </p>
      <Link to="/" className="btn-primary mt-2">Back to home</Link>
    </div>
  );
}
