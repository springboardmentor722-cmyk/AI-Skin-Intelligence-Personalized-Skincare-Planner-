import "./ComingSoon.css";

export default function ComingSoon({ title, description }) {
  return (
    <div className="glass-card coming-soon">
      <span className="badge badge-coming-soon">Coming Soon</span>
      <h2>{title}</h2>
      <p>
        {description ||
          "This module is planned for a future milestone and will plug into the platform without requiring architectural changes."}
      </p>
    </div>
  );
}
