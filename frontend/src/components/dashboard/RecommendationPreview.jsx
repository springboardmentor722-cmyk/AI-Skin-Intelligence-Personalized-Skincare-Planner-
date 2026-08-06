import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRecommendations } from "../../services/recommendationService";

function RecommendationPreview() {

    const [products, setProducts] = useState([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const fetchRecommendations = async () => {

            try {

                const data = await getRecommendations();

                setProducts(data.products.slice(0, 3));

            } catch (error) {

                console.error(error);

            } finally {

                setLoading(false);

            }

        };

        fetchRecommendations();

    }, []);

    return (

<div className="mt-10">

    <div className="flex items-center justify-between mb-6">

        <div>

            <h2 className="text-3xl font-bold text-gray-800">

                🤖 Latest Recommendations

            </h2>

            <p className="text-gray-500 mt-1">

                AI selected products specially for your skin.

            </p>

        </div>

        <Link
            to="/recommendations"
            className="text-green-700 font-semibold hover:underline"
        >
            View All →
        </Link>

    </div>

    {loading ? (

        <div className="bg-white rounded-3xl p-10 text-center shadow-lg">

            Loading Recommendations...

        </div>

    ) : (

        <div className="grid md:grid-cols-3 gap-6">

            {products.map((item, index) => (

                <div
                    key={index}
                    className="group bg-white rounded-3xl border border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden"
                >

                    {/* Product Image */}

                    <div className="h-52 bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">

                        <div className="text-7xl">

                            🧴

                        </div>

                    </div>

                    {/* Content */}

                    <div className="p-6">

                        <h3 className="text-xl font-bold text-gray-800">

                            {item.product_name}

                        </h3>

                        <p className="text-gray-500 mt-2">

                            {item.brand}

                        </p>

                        <div className="flex items-center justify-between mt-6">

                            <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold">

                                ⭐ {item.rating}

                            </span>

                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">

                                {item.confidence}

                            </span>

                        </div>

                        <button
                            className="mt-6 w-full h-12 rounded-xl bg-gradient-to-r from-green-700 to-emerald-500 text-white font-semibold hover:scale-[1.02] transition"
                        >

                            View Details

                        </button>

                    </div>

                </div>

            ))}

        </div>

    )}

</div>

);

}

export default RecommendationPreview;