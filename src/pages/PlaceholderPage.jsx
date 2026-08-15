import DashboardLayout from "../components/DashboardLayout";
import ComingSoon from "../components/ComingSoon";

/**
 * Generic placeholder rendered inside a role's dashboard shell.
 * Used for menu entries that exist today but whose full functionality
 * (client assignment, patient records, AI diagnosis, etc.) ships in a
 * future milestone. Keeps every sidebar link alive with no broken routes.
 */
export default function PlaceholderPage({ items, roleLabel, title, description }) {
  return (
    <DashboardLayout items={items} roleLabel={roleLabel}>
      <div className="dashboard-header">
        <span className="eyebrow">{roleLabel}</span>
        <h1>{title}</h1>
      </div>
      <ComingSoon title={title} description={description} />
    </DashboardLayout>
  );
}
