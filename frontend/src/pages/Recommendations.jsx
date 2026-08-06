import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { getRecommendations } from "../services/recommendationService";
import RecommendationCard from "../components/recommendations/RecommendationCard";

function Recommendations() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const productsPerPage = 10;

  

  useEffect(() => {

  const fetchRecommendations = async () => {
  try {
    setLoading(true);

    console.log("Fetching recommendations...");

    const data = await getRecommendations();

    console.log("API Success:", data);

    setProducts(data.products);

  } catch (error) {
    console.error("Recommendation Error:", error);

    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Data:", error.response.data);
    }
  } finally {
    console.log("Loading finished");
    setLoading(false);
  }
};

  fetchRecommendations();

}, []);

const indexOfLastProduct = currentPage * productsPerPage;

const indexOfFirstProduct =
  indexOfLastProduct - productsPerPage;

const currentProducts = products.slice(
  indexOfFirstProduct,
  indexOfLastProduct
);

const totalPages = Math.ceil(
  products.length / productsPerPage
);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">

<div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-green-700 via-emerald-600 to-green-500 p-10 mb-10 shadow-xl">

<div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10"></div>

<div className="flex justify-between items-center">

<div>

<p className="text-green-100 text-lg">

AI Personalized Care

</p>

<h1 className="text-5xl font-bold text-white mt-2">

Recommended Products

</h1>

<p className="text-green-50 mt-5 text-lg max-w-2xl leading-8">

These recommendations are generated using your AI skin analysis, skin profile, lifestyle information, and ingredient compatibility to provide products best suited for your skin.
</p>

</div>

<div className="hidden lg:flex">

<div className="w-32 h-32 rounded-full bg-white/15 flex items-center justify-center text-6xl">

🧴

</div>

</div>

</div>

</div>
</div>

<div className="bg-white rounded-[32px] shadow-xl border border-gray-100 p-8 mb-10">

<h2 className="text-3xl font-bold text-gray-800">

🤖 AI Recommendation Summary

</h2>

<p className="text-gray-600 mt-5 leading-8 text-lg">

Our AI analyzed your skin type, concerns, lifestyle habits, and assessment history to recommend products that best suit your current skin condition.

</p>

</div>

      {loading ? (
        <div className="text-center py-32">

<div className="text-7xl animate-pulse">

🤖

</div>

<h2 className="text-3xl font-bold mt-8">

AI is selecting the best skincare...

</h2>

<p className="text-gray-500 mt-3">

This usually takes only a few seconds.

</p>

</div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">

          {products.length > 0 ? (

            currentProducts.map((item) => (
  <RecommendationCard
    key={item.product_id}
    item={item}
  />
))

          ) : (

            <div className="col-span-3 bg-white rounded-[30px] shadow-lg p-20 text-center">

<div className="text-7xl mb-6">

🧴

</div>

<h2 className="text-3xl font-bold">

No Recommendations Yet

</h2>

<p className="text-gray-500 mt-5 text-lg">

Complete your Skin Profile and AI Skin Assessment to receive personalized product recommendations.

</p>

</div>


          )}

        </div>

    
      )}

      {products.length > productsPerPage && (
  <div className="flex justify-center items-center gap-3 mt-10">

    <button
      onClick={() => setCurrentPage((prev) => prev - 1)}
      disabled={currentPage === 1}
      className={`px-4 py-2 rounded-lg border ${
        currentPage === 1
          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
          : "bg-white hover:bg-gray-100"
      }`}
    >
      Previous
    </button>

    {Array.from({ length: totalPages }, (_, i) => (
      <button
        key={i}
        onClick={() => {
  setCurrentPage((prev) => prev - 1);
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}}
        className={`w-10 h-10 rounded-lg ${
          currentPage === i + 1
            ? "bg-green-600 text-white"
            : "bg-white border hover:bg-gray-100"
        }`}
      >
        {i + 1}
      </button>
    ))}

    <button
      onClick={() => {
  setCurrentPage((prev) => prev + 1);
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}}
      disabled={currentPage === totalPages}
      className={`px-4 py-2 rounded-lg border ${
        currentPage === totalPages
          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
          : "bg-white hover:bg-gray-100"
      }`}
    >
      Next
    </button>

  </div>
)}
    </DashboardLayout>
  );
}

export default Recommendations;