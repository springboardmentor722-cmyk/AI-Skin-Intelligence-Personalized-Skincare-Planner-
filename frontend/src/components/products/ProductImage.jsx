function ProductImage({ imageUrl, category, productName }) {

  const getPlaceholder = () => {
    const cat = (category || "").toLowerCase();

    if (cat.includes("cleanser"))
      return "https://placehold.co/400x250/dbeafe/1e40af?text=Cleanser";

    if (cat.includes("serum"))
      return "https://placehold.co/400x250/fef3c7/b45309?text=Serum";

    if (cat.includes("moisturizer"))
      return "https://placehold.co/400x250/d1fae5/065f46?text=Moisturizer";

    if (cat.includes("sunscreen"))
      return "https://placehold.co/400x250/fef2f2/dc2626?text=Sunscreen";

    if (cat.includes("toner"))
      return "https://placehold.co/400x250/e0f2fe/0284c7?text=Toner";

    return "https://placehold.co/400x250/e5e7eb/374151?text=Skincare";
  };

  const fallback = getPlaceholder();

  return (
    <div className="w-full h-56 bg-white flex items-center justify-center overflow-hidden">
      <img
    src={imageUrl ? `/products/${imageUrl}` : fallback}
    alt={productName}
    className="max-w-full max-h-full object-contain p-3"
    onError={(e) => {
        e.target.onerror = null;
        e.target.src = fallback;
    }}
/>
    </div>
  );
}

export default ProductImage;