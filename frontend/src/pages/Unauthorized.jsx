import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-6">
      <h1 className="text-2xl font-semibold">You don't have access to this page</h1>
      <p className="text-ink-secondary max-w-sm">
        This area is restricted to a different role. If you think this is a mistake, contact an admin.
      </p>
      <Link to="/" className="text-ocean-600 font-medium mt-2">
        Back to home
      </Link>
    </div>
  );
}
