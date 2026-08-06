import { Link } from "react-router-dom";

function RecommendationCard({ item }) {

  console.log("Recommendation Item:", item);

  console.log("Recommendation Item:", item);
console.log("Product ID:", item.product_id);

  return (

    
  
    <div className="bg-white rounded-[28px] shadow-lg hover:shadow-2xl transition duration-300 overflow-hidden border border-gray-100">

     <div className="p-6">
      {/* Product Name */}
      <h2 className="text-xl font-bold text-gray-800">
        {item.product_name}
      </h2>

      {/* Brand */}
      <p className="text-gray-500 mt-1">
        {item.brand}
      </p>

      

      {/* Badges */}
      <div className="flex gap-2 mt-4 flex-wrap">

        <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-semibold text-sm">
{item.product_type}
</span>

<span className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold text-sm">
 {item.budget}
</span>

      </div>

      {/* Product Details */}
      <div className="grid grid-cols-2 gap-3 mt-5">

        <div>
          <p className="text-gray-500 text-sm">
            Price
          </p>

          <p className="font-bold">
  ₹{item.price}
</p>
        </div>

        <div>
          <p className="text-gray-500 text-sm">
            Rating
          </p>

          <p className="font-bold">
            {item.rating} ★
          </p>
        </div>

        <div>
          <p className="text-gray-500 text-sm">
            AI Score
          </p>

          <p className="font-bold text-blue-700">
            {item.score} pts
          </p>
        </div>

        <div>
          <p className="text-gray-500 text-sm">
            Confidence
          </p>

          <p className="font-bold text-green-600">
            {item.confidence}%
          </p>
        </div>

      </div>

      {/* Reasons */}
      <div className="mt-6">

        <h3 className="font-semibold mb-2">
          Why Recommended?
        </h3>

        <ul className="space-y-2">

          {item.reason.slice(0, 5).map((reason, index) => (

            <li
              key={index}
              className="text-sm text-gray-600"
            >
              • {reason}
            </li>

          ))}

        </ul>

        

      </div>

      <div className="mt-8">

<Link
  to={`/products/${item.product_id}`}
  className="block w-full py-4 rounded-2xl bg-gradient-to-r from-green-700 to-emerald-500 text-white font-bold text-center hover:scale-105 transition"
>
  View Product
</Link>

</div>

      
      </div>
      

    </div>
  );
}

export default RecommendationCard;