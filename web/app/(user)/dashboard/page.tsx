// Shell smoke test only — not a designed screen. Real User dashboard is a separate
// feature/frontend-dashboard task against web/designs/wireframes/ + docs/WIREFRAMES.md.
export default function UserDashboardPage() {
  return (
    <div className="border-border bg-card rounded-lg border p-6">
      <h2 className="font-heading text-card-foreground text-base font-semibold">
        User dashboard
      </h2>
      <p className="text-muted-foreground mt-2 font-sans text-sm">
        App shell smoke test — this screen isn&apos;t built yet.
      </p>
    </div>
  );
}
