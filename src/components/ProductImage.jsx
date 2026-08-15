import "./ProductImage.css";

const CATEGORY_STYLES = {
  Cleanser: { bg: "#dbeafe", fg: "#2563eb", icon: "💧" },
  Serum: { bg: "#fce7f3", fg: "#db2777", icon: "🧪" },
  Moisturizer: { bg: "#fef3c7", fg: "#d97706", icon: "🫙" },
  Sunscreen: { bg: "#fef9c3", fg: "#ca8a04", icon: "☀️" },
  Toner: { bg: "#d1fae5", fg: "#059669", icon: "🌿" },
  Mask: { bg: "#ede9fe", fg: "#7c3aed", icon: "🎭" },
  Treatment: { bg: "#fee2e2", fg: "#dc2626", icon: "✨" },
};

const DEFAULT_STYLE = { bg: "#e5e7eb", fg: "#4b5563", icon: "🧴" };

/**
 * Renders a clean, generated icon tile for a product category instead of
 * real product photography. Real product photos are copyrighted brand
 * marketing assets we don't have rights to reproduce; the product NAME
 * and BRAND shown alongside this are real, publicly known facts.
 */
export default function ProductImage({ category, size = 120 }) {
  const style = CATEGORY_STYLES[category] || DEFAULT_STYLE;
  return (
    <div
      className="product-image"
      style={{
        width: size,
        height: size,
        background: style.bg,
        color: style.fg,
        fontSize: size * 0.4,
      }}
      aria-label={category}
    >
      {style.icon}
    </div>
  );
}
