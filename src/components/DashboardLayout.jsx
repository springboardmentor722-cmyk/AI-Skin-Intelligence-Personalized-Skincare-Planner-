import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardLayout({ items, roleLabel, children }) {
  return (
    <div className="dashboard-shell">
      <Sidebar items={items} roleLabel={roleLabel} />
      <div className="dashboard-body">
        <Topbar roleLabel={roleLabel} />
        <main className="dashboard-main">{children}</main>
      </div>
    </div>
  );
}
