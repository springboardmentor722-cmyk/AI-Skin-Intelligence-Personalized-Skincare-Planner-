import "./Avatar.css";

const COLORS = ["#4f46e5", "#8b5cf6", "#ec9a7a", "#059669", "#db2777", "#0891b2", "#d97706"];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] || "").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();
}

export default function Avatar({ name, size = 38 }) {
  const initials = getInitials(name);
  const color = COLORS[hashString(name || "?") % COLORS.length];

  return (
    <div
      className="avatar"
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
      title={name}
    >
      {initials}
    </div>
  );
}
