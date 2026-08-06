import DashboardLayout from "../../layouts/DashboardLayout";
import {
  ScanFace,
  ClipboardList,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";

function UserDashboard() {
  const stats = [
    {
      title: "Skin Score",
      value: "78%",
      subtitle: "Good",
      icon: <ScanFace size={28} />,
      color: "bg-emerald-100 text-emerald-600",
    },
    {
      title: "Assessments",
      value: "3",
      subtitle: "This Month",
      icon: <ClipboardList size={28} />,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Products",
      value: "5",
      subtitle: "Using",
      icon: <ShoppingBag size={28} />,
      color: "bg-orange-100 text-orange-600",
    },
  ];

  const products = [
    {
      name: "Cetaphil Gentle Cleanser",
      ingredient: "Niacinamide",
      rating: "4.7",
    },
    {
      name: "Minimalist Niacinamide",
      ingredient: "Niacinamide",
      rating: "4.6",
    },
    {
      name: "Neutrogena Moisturizer",
      ingredient: "Glycerin",
      rating: "4.5",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Welcome */}

        <div>
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome Back, Vasu 👋
          </h1>

          <p className="text-gray-500 mt-2">
            Here's your skin health overview.
          </p>
        </div>

        {/* Stats */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {stats.map((item) => (

            <div
              key={item.title}
              className="bg-white rounded-3xl shadow-md p-6 hover:shadow-xl transition"
            >

              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.color}`}
              >
                {item.icon}
              </div>

              <h3 className="text-gray-500 mt-5">
                {item.title}
              </h3>

              <h2 className="text-3xl font-bold mt-2">
                {item.value}
              </h2>

              <p className="text-gray-400 mt-1">
                {item.subtitle}
              </p>

            </div>

          ))}

        </div>

        {/* Recent Assessment */}

        <div className="bg-white rounded-3xl shadow-md p-6">

          <div className="flex justify-between items-center">

            <div>

              <h2 className="text-xl font-semibold">
                Recent Assessment
              </h2>

              <p className="text-gray-500 mt-2">
                08 July 2026
              </p>

              <p className="text-gray-700 font-medium">
                Skin Score : 78%
              </p>

            </div>

            <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl flex items-center gap-2">

              View Details

              <ArrowRight size={18} />

            </button>

          </div>

        </div>

        {/* Products */}

        <div className="bg-white rounded-3xl shadow-md p-6">

          <h2 className="text-xl font-semibold mb-6">
            Top Recommended Products
          </h2>

          <div className="grid md:grid-cols-3 gap-6">

            {products.map((product) => (

              <div
                key={product.name}
                className="border rounded-2xl p-5 hover:shadow-lg transition"
              >

                <div className="w-full h-36 bg-gray-100 rounded-xl mb-4 flex items-center justify-center">

                  <ShoppingBag size={40} className="text-gray-400" />

                </div>

                <h3 className="font-semibold">
                  {product.name}
                </h3>

                <p className="text-gray-500 mt-2">
                  Key Ingredient : {product.ingredient}
                </p>

                <p className="mt-2">
                  ⭐ {product.rating}
                </p>

                <button className="mt-5 w-full bg-gray-900 text-white py-3 rounded-xl hover:bg-black transition">
                  View Details
                </button>

              </div>

            ))}

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}

export default UserDashboard;