import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { getIngredientById } from "../services/ingredientService";
import {  useNavigate } from "react-router-dom";

function IngredientDetails() {
  const { id } = useParams();

  const [ingredient, setIngredient] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchIngredient = async () => {
      try {
        const data = await getIngredientById(id);
        setIngredient(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchIngredient();
  }, [id]);

  if (!ingredient) {
    return (
      <DashboardLayout>

        
        <div className="text-center py-20 text-xl font-semibold">
          Loading Ingredient...
        </div>
      </DashboardLayout>
    );
  }

  return (
  <DashboardLayout>
     <div className="mb-6">
    <button
      onClick={() => navigate("/ingredients")}
      className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
    >
      ← Back to Ingredients
    </button>
  </div>

  <div className="bg-white rounded-xl shadow-lg overflow-hidden"></div>
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">

      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-8">
        <h1 className="text-4xl font-bold">
          {ingredient.ingredient_name}
        </h1>

        <p className="mt-2 text-blue-100">
          Cosmetic Ingredient Information
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 p-8">

        <div className="space-y-5">

          <div className="border rounded-lg p-4">
            <p className="text-gray-500">Substance ID</p>
            <h3 className="font-semibold text-lg">
              {ingredient.substance_id || "N/A"}
            </h3>
          </div>

          <div className="border rounded-lg p-4">
            <p className="text-gray-500">CAS Number</p>
            <h3 className="font-semibold text-lg">
              {ingredient.cas_no || "N/A"}
            </h3>
          </div>

          <div className="border rounded-lg p-4">
            <p className="text-gray-500">EC Number</p>
            <h3 className="font-semibold text-lg">
              {ingredient.ec_no || "N/A"}
            </h3>
          </div>

          <div className="border rounded-lg p-4">
            <p className="text-gray-500">PubChem CID</p>
            <h3 className="font-semibold text-lg">
              {ingredient.pubchem_cid || "N/A"}
            </h3>
          </div>

        </div>

        <div className="space-y-5">

          <div className="border rounded-lg p-4">
            <p className="text-gray-500">Category</p>
            <h3 className="font-semibold text-lg">
              {ingredient.category || "Not Available"}
            </h3>
          </div>

          <div className="border rounded-lg p-4">
            <p className="text-gray-500">Functions</p>
            <h3 className="font-semibold text-lg">
              {ingredient.functions || "Not Available"}
            </h3>
          </div>

          <div className="border rounded-lg p-4">
            <p className="text-gray-500">PubChem</p>

            {ingredient.pubchem_url ? (
              <a
                href={ingredient.pubchem_url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline font-semibold"
              >
                Open in PubChem →
              </a>
            ) : (
              <p>Not Available</p>
            )}

          </div>

        </div>

      </div>

      <div className="border-t p-8">

        <h2 className="text-2xl font-bold mb-4">
          Description
        </h2>

        <p className="text-gray-700">
          {ingredient.description || "No description available."}
        </p>

      </div>

      <div className="grid md:grid-cols-2 gap-8 border-t p-8">

        <div>

          <h2 className="text-xl font-bold mb-3">
            Benefits
          </h2>

          <p className="text-gray-700">
            {ingredient.benefits || "No benefits available."}
          </p>

        </div>

        <div>

          <h2 className="text-xl font-bold mb-3">
            Suitable Skin Types
          </h2>

          <p className="text-gray-700">
            {ingredient.suitable_skin_types || <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm">
  Not Available
</span>}
          </p>

        </div>

      </div>

      <div className="grid md:grid-cols-3 gap-6 border-t p-8">

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold">
            Skin Concerns
          </h3>

          <p className="mt-2">
            {ingredient.skin_concerns || "N/A"}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold">
            Comedogenic Rating
          </h3>

          <p className="mt-2">
            {ingredient.comedogenic_rating ?? "N/A"}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold">
            Irritation Level
          </h3>

          <p className="mt-2">
            {ingredient.irritation_level || "N/A"}
          </p>
        </div>

      </div>

    </div>
  </DashboardLayout>
);
}

export default IngredientDetails;