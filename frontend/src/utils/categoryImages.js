// Maps a Product.category value to its representative photo.
// One image per category (not per product) keeps this simple and avoids
// a Product table migration — swap in per-product photos later if needed.
export const CATEGORY_IMAGES = {
  Cleansing: "/images/product-cleansing.png",
  Treatment: "/images/product-treatment.png",
  Moisturizing: "/images/product-moisturizing.png",
  "Sun Protection": "/images/product-sun-protection.png",
  "Night Care": "/images/product-night-care.png",
  Exfoliation: "/images/product-exfoliation.png",
};

export function getCategoryImage(category) {
  return CATEGORY_IMAGES[category] || "/images/product-treatment.png";
}
