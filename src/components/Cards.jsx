import { Link } from "react-router-dom";
import "./Cards.css";

export function FeatureCard({ icon, title, description, comingSoon }) {
  return (
    <div className="glass-card feature-card">
      <div className="feature-card-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {comingSoon && <span className="badge badge-coming-soon">Coming Soon</span>}
    </div>
  );
}

export function RoleCard({ title, description, icon, to }) {
  return (
    <Link to={to} className="glass-card role-card">
      <div className="role-card-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      <span className="role-card-cta">Continue as {title} &rarr;</span>
    </Link>
  );
}

export function DashboardCard({ label, value, sub, accent }) {
  return (
    <div className={`glass-card dashboard-card ${accent ? "accent" : ""}`}>
      <p className="dashboard-card-label">{label}</p>
      <p className="dashboard-card-value">{value}</p>
      {sub && <p className="dashboard-card-sub">{sub}</p>}
    </div>
  );
}
