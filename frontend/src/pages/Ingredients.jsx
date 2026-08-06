import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import AdminLayout from "../layouts/AdminLayout";
import {
  getIngredients,
  searchIngredients,
} from "../services/ingredientService";
import IngredientCard from "../components/ingredients/IngredientCard";

function Ingredients() {
  const role = localStorage.getItem("role");
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const limit = 20;

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        setLoading(true);

        let data;

        if (search.trim() !== "") {
          data = await searchIngredients({
            name: search,
            skip: (page - 1) * limit,
            limit,
          });
        } else {
          data = await getIngredients(
            (page - 1) * limit,
            limit
          );
        }

        setIngredients(data);
        setHasMore(data.length === limit);

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchIngredients();
  }, [page, search]);

  const handleSearch = () => {
    setPage(1);
  };

  const clearSearch = async () => {
    setSearch("");
    setPage(1);

    try {
      setLoading(true);

      const data = await getIngredients(0, limit);
      setIngredients(data);
      setHasMore(data.length === limit);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const Layout =
  role === "admin"
    ? AdminLayout
    : DashboardLayout;

return (
  <Layout>

      <div className="max-w-7xl mx-auto">

<div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-green-700 via-emerald-600 to-green-500 p-10 mb-10 shadow-xl">

<div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10"></div>

<div className="flex justify-between items-center">

<div>

<p className="text-green-100 text-lg">

AI Ingredient Database

</p>

<h1 className="text-5xl font-bold text-white mt-2">

Ingredients Explorer

</h1>

<p className="text-green-50 mt-5 text-lg max-w-2xl leading-8">

Learn what each skincare ingredient does, discover its benefits,
and understand whether it is suitable for your skin.

</p>

</div>

<div className="hidden lg:flex">

<div className="w-32 h-32 rounded-full bg-white/15 flex items-center justify-center text-6xl">

🧪

</div>

</div>

</div>
</div>

</div>

     <div className="bg-white rounded-[28px] shadow-xl border border-gray-100 p-8 mb-10">

<div className="flex flex-col lg:flex-row gap-4">

        <input
          type="text"
          placeholder="Search Ingredients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
          className="flex-1 rounded-2xl border border-gray-200 px-6 py-4 text-lg focus:ring-2 focus:ring-green-500 outline-none transition"
        />

        <button
          onClick={handleSearch}
          className="bg-gradient-to-r from-green-700 to-emerald-500 text-white px-8 rounded-2xl hover:scale-105 transition"
        >
          Search
        </button>

        <button
          onClick={clearSearch}
          className="bg-gray-100 text-gray-700 px-8 rounded-2xl hover:bg-gray-200 transition"
        >
          Clear
        </button>
        </div>

      </div>

      {loading ? (

        <div className="text-center text-xl font-semibold py-20">
          Loading Ingredients...
        </div>

      ) : (

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">

          {ingredients.length > 0 ? (

            ingredients.map((ingredient) => (
              <IngredientCard
                key={ingredient.id}
                ingredient={ingredient}
              />
            ))

          ) : (

            <div className="col-span-3 text-center py-20">

              <h2 className="text-2xl font-bold text-gray-600">
                🔍 No Ingredients Found
              </h2>

              <p className="text-gray-500 mt-2">
                Try another ingredient name.
              </p>

            </div>

          )}

        </div>

      )}

      <div className="flex justify-center items-center gap-6 mt-14">

        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-6 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 transition"
        >
          Previous
        </button>

        <span className="font-bold text-lg">
          Page {page}
        </span>

        <button
          disabled={!hasMore}
          onClick={() => setPage(page + 1)}
          className={`px-6 py-3 rounded-2xl text-white font-semibold transition

${
hasMore
? "bg-gradient-to-r from-green-700 to-emerald-500 hover:scale-105"
: "bg-gray-400 cursor-not-allowed"
}`}
        >
          Next
        </button>

      </div>

    </Layout>
  ) ;
}

export default Ingredients;