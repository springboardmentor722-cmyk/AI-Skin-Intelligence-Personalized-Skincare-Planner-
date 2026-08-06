import { Link } from "react-router-dom";

function IngredientCard({
  ingredient,
  role,
  onEdit,
  onDelete,
}) {
  return (
    <div className="bg-white rounded-[30px] overflow-hidden border border-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">

      <div className="bg-gradient-to-r from-green-700 to-emerald-500 p-6">

<div className="flex justify-between items-center">

<div>

<h2 className="text-2xl font-bold text-white">

{ingredient.ingredient_name}

</h2>

<p className="text-green-100 mt-2">

{ingredient.category || "Ingredient"}

</p>

</div>

<div className="text-5xl">

🧪

</div>

</div>

</div>

<div className="p-6">

        <div>
          <span className="font-semibold text-green-700">
            Functions:
          </span>
          <p className="text-gray-600 line-clamp-2">
            {ingredient.functions || "N/A"}
          </p>
        </div>

        <div>
          <span className="font-semibold text-purple-700">
            Benefits:
          </span>
          <p className="text-gray-600 line-clamp-3">
            {ingredient.benefits || "N/A"}
          </p>
        </div>

        <div>
          <span className="font-semibold text-orange-700">
            Suitable Skin Types:
          </span>
          <p className="text-gray-600">
            {ingredient.suitable_skin_types || "All Skin Types"}
          </p>
        </div>

        <div>
          <span className="font-semibold text-red-700">
            Skin Concerns:
          </span>
          <p className="text-gray-600">
            {ingredient.skin_concerns || "N/A"}
          </p>
        </div>

        <div className="flex justify-between">

          <div>
            <span className="font-semibold">
              Comedogenic:
            </span>
            <p>
              {ingredient.comedogenic_rating ?? "N/A"}
            </p>
          </div>

          <div>
            <span className="font-semibold">
              Irritation:
            </span>
            <p>
              {ingredient.irritation_level || "N/A"}
            </p>
          </div>

        </div>

      </div>

      <Link
        to={`/ingredients/${ingredient.id}`}
        className="block mt-8 bg-gradient-to-r from-green-700 to-emerald-500 text-white text-center py-3 rounded-2xl font-bold hover:scale-105 transition-all"
      >
        View Details
      </Link>

      {role === "admin" && (

        <div className="flex gap-2 mt-4">

          <button
            onClick={() => onEdit(ingredient)}
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg"
          >
            Edit
          </button>

          <button
            onClick={() => onDelete(ingredient.id)}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg"
          >
            Delete
          </button>

        </div>

      )}

    </div>
  );
}

export default IngredientCard;