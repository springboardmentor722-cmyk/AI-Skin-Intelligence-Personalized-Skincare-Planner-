import { Link } from "react-router-dom";
import ProductImage from "./ProductImage";

function ProductCard({ product, role, onEdit, onDelete }) {
  
  return (
    <div  className="bg-white rounded-[28px] shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden border border-gray-100">
      <div className="relative">

    <ProductImage
    imageUrl={product.image_url}
    category={product.category}
    productName={product.product_name}
/>
    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

</div>

      <div className="p-5">
        <h2 className="text-2xl font-bold text-gray-900 line-clamp-2 leading-8">
          {product.product_name}
        </h2>

        <div className="flex flex-wrap gap-3 mt-4">

    <span className="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-full text-sm font-semibold">

        🏷 {product.brand_name}

    </span>

    <span className="bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-full text-sm font-semibold">

        🌿 {product.category}

    </span>

</div>
<div className="mt-3">

<span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">

Suitable for {product.skin_type || "All Skin Types"}

</span>

</div>

        <div className="flex items-center mt-5">

    <span className="text-yellow-400 text-2xl">

        {"★".repeat(Math.round(product.rating || 0))}
        {"☆".repeat(5 - Math.round(product.rating || 0))}

    </span>

    <span className="ml-3 font-semibold text-gray-700">

        {product.rating || "N/A"}

    </span>

</div>

        <div className="mt-3">
  <span className="bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold px-5 py-3 rounded-full text-lg shadow">
    ₹{product.price || "N/A"}
  </span>
</div>
<div className="flex gap-2 mt-4 flex-wrap">

  

  {product.new && (
  <span className="bg-green-600 text-white px-3 py-2 rounded-full text-xs font-semibold">
    🆕 New
  </span>
)}



{product.out_of_stock && (
  <span className="bg-red-600 text-white px-3 py-2 rounded-full text-xs font-semibold">
    ❌ Out of Stock
  </span>
)}

</div>

        <Link
          to={`/products/${product.product_id}`}
          className="block mt-6 bg-gradient-to-r from-green-700 to-emerald-500 text-white text-center py-3 rounded-2xl font-bold hover:scale-105 transition-all"
        >
          View Details
        </Link>

        {role === "admin" && (

  <div className="flex gap-2 mt-4">

    <button
      onClick={() => onEdit(product)}
      className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white py-3 rounded-2xl font-semibold hover:scale-105 transition"
    >
      Edit
    </button>

    <button
      onClick={() => onDelete(product.product_id)}
      className="flex-1 bg-gradient-to-r from-red-600 to-rose-500 text-white py-3 rounded-2xl font-semibold hover:scale-105 transition"
    >
      Delete
    </button>

  </div>

)}
        
      </div>
    </div>
  );
}

export default ProductCard;