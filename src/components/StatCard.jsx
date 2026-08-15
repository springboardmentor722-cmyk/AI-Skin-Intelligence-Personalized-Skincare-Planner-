import "./StatCard.css";

const TONES = {
  indigo: { bg: "#e0e7ff", fg: "#4338ca" },
  green: { bg: "#d1fae5", fg: "#059669" },
  blue: { bg: "#dbeafe", fg: "#2563eb" },
  amber: { bg: "#fef3c7", fg: "#d97706" },
  rose: { bg: "#fce7f3", fg: "#db2777" },
};

export default function StatCard({ icon: Icon, label, value, sub, tone = "indigo" }) {
  const colors = TONES[tone] || TONES.indigo;
  return (
    <div className="glass-card stat-card">
      {Icon && (
        <div className="stat-card-icon" style={{ background: colors.bg, color: colors.fg }}>
          <Icon size={20} />
        </div>
      )}
      <div className="stat-card-body">
        <span className="stat-card-label">{label}</span>
        <span className="stat-card-value">{value}</span>
        {sub && <span className="stat-card-sub">{sub}</span>}
      </div>
    </div>
  );
}
