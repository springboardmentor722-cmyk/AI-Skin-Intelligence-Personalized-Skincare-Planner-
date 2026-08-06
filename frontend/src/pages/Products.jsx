import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import AdminLayout from "../layouts/AdminLayout";

import {
  getProducts,
  searchProducts,
  getBrands,
  getCategories,
  deleteProduct,
  updateProduct
} from "../services/productService";
import ProductCard from "../components/products/ProductCard";

function Products() {
  const role = localStorage.getItem("role");
  const [products, setProducts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [brands, setBrands] = useState([]);
const [categories, setCategories] = useState([]);

const [selectedBrand, setSelectedBrand] = useState("");
const [selectedCategory, setSelectedCategory] = useState("");
const [showEditModal, setShowEditModal] = useState(false);

const [editingProduct, setEditingProduct] = useState(null);

  const [page, setPage] = useState(1);

  const limit = 20;

  useEffect(() => {
  const fetchProducts = async () => {
    try {
      setLoading(true);

      let data;

      if (
        search.trim() !== "" ||
        selectedBrand !== "" ||
        selectedCategory !== ""
      ) {
        data = await searchProducts({
          name: search,
          brand: selectedBrand,
          category: selectedCategory,
          skip: (page - 1) * limit,
          limit: limit,
        });
      } else {
        data = await getProducts(
          (page - 1) * limit,
          limit
        );
      }

      setProducts(data);
      setHasMore(data.length === limit);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  fetchProducts();
}, [page, search, selectedBrand, selectedCategory]);

 
  useEffect(() => {
  const loadFilters = async () => {
    try {
      const brandData = await getBrands();
      const categoryData = await getCategories();

      setBrands(brandData);
      setCategories(categoryData);
    } catch (error) {
      console.error(error);
    }
  };

  loadFilters();
}, []);

  const handleSearch = async () => {
    setPage(1);
  try {
    setLoading(true);

    // If all filters are empty, reload products
    if (
      search.trim() === "" &&
      selectedBrand === "" &&
      selectedCategory === ""
    ) {
      const data = await getProducts(
        (page - 1) * limit,
        limit
      );
      setProducts(data);
      setHasMore(data.length === limit);
      setLoading(false);
      return;
    }

    const data = await searchProducts({
      name: search,
      brand: selectedBrand,
      category: selectedCategory,
    });
    setProducts(data);
    setHasMore(data.length === limit);
    setLoading(false);

  } catch (error) {
    setLoading(false);
    console.error(error);
    alert("Search Failed");
  }
};

const clearFilters = async () => {
  setSearch("");
  setSelectedBrand("");
  setSelectedCategory("");
  setPage(1);

  try {
    setLoading(true);

    const data = await getProducts(0, limit);
    setProducts(data);
    setHasMore(data.length === limit);

  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};

const handleEdit = (product) => {

  setEditingProduct(product);

  setShowEditModal(true);

};

const handleUpdate = async () => {

  try {

    await updateProduct(
      editingProduct.product_id,
      editingProduct
    );

    alert("Product Updated Successfully");

    setShowEditModal(false);

    const data = await getProducts(
      (page - 1) * limit,
      limit
    );

    setProducts(data);

  } catch (error) {

    console.error(error);

    alert("Update Failed");

  }

};

const handleDelete = async (productId) => {

  const confirmDelete = window.confirm(
    "Are you sure you want to delete this product?"
  );

  if (!confirmDelete) return;

  try {

    await deleteProduct(productId);

    alert("Product deleted successfully.");

    setProducts(
      products.filter(
        (product) => product.product_id !== productId
      )
    );

  } catch (error) {

    console.error(error);

    alert("Failed to delete product.");

  }

};
      


    
  const Layout =
  role === "admin"
    ? AdminLayout
    : DashboardLayout;

return (
  <Layout>
      
     <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-green-700 via-emerald-600 to-green-500 p-10 mb-10 shadow-xl">

    <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10"></div>

    <div className="flex justify-between items-center">

        <div>

            <p className="text-green-100 text-lg">
                AI Product Library
            </p>

            <h1 className="text-5xl font-bold text-white mt-2">
                Skincare Products
            </h1>

            <p className="text-green-50 mt-5 text-lg max-w-2xl">

                Discover products personalized for every skin type,
                concern and treatment.

            </p>

        </div>

        <div className="hidden lg:flex">

            <div className="w-32 h-32 rounded-full bg-white/15 flex items-center justify-center text-6xl">

                🧴

            </div>

        </div>

    </div>

</div>

      <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">

<div className="flex flex-col lg:flex-row gap-4">
        <input
  type="text"
  placeholder="Search Products..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  }}
  className="flex-1 rounded-2xl border border-gray-200 px-5 py-4 focus:ring-2 focus:ring-green-500 outline-none"
/>
        <button
          onClick={handleSearch}
          className="bg-gradient-to-r from-green-700 to-emerald-500 text-white px-8 rounded-2xl font-semibold hover:scale-105 transition"
        >
          Search
        </button>
        {role === "admin" && (

  <button
    className="bg-gradient-to-r from-blue-600 to-indigo-500 text-white px-8 rounded-2xl font-semibold hover:scale-105 transition"
  >
    + Add Product
  </button>

)}
        <button
  onClick={clearFilters}
  className="bg-gray-200 text-gray-700 px-8 rounded-2xl hover:bg-gray-300 transition"
>
  Clear
</button>
      </div>
      </div>
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">

<div className="flex flex-col md:flex-row gap-5">

  <select
    value={selectedBrand}
    onChange={(e) => setSelectedBrand(e.target.value)}
    className="rounded-2xl border border-gray-200 px-5 py-4 w-full"
  >
    <option value="">All Brands</option>

    {brands.map((brand) => (
      <option key={brand} value={brand}>
        {brand}
      </option>
    ))}
  </select>

  <select
    value={selectedCategory}
    onChange={(e) => setSelectedCategory(e.target.value)}
    className="rounded-2xl border border-gray-200 px-5 py-4 w-full"
  >
    <option value="">All Categories</option>

    {categories.map((category) => (
      <option key={category} value={category}>
        {category}
      </option>
    ))}
  </select>

</div>
</div>

      {loading ? (

  <div className="flex flex-col items-center py-20">

<div className="animate-spin rounded-full h-16 w-16 border-4 border-green-600 border-t-transparent"></div>

<p className="mt-6 text-xl font-semibold">

Loading Products...

</p>

</div>

) : (

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

  {products.length > 0 ? (
  products.map((product) => (
  <ProductCard
    key={product.product_id}
    product={product}
    role={role}
    onEdit={handleEdit}
    onDelete={handleDelete}
  />
))
) : (
  <div className="col-span-3 text-center py-20">
    <h2 className="text-2xl font-bold text-gray-600">
     📦

No Products Found

Try changing filters
    </h2>

    <p className="text-gray-500 mt-2">
      Try another product name, brand or category.
    </p>
  </div>
)}

</div>

)}
      <div className="flex justify-center gap-4 mt-10">

  <button
    disabled={page === 1}
    onClick={() => setPage(page - 1)}
    className="bg-gray-300 px-5 py-2 rounded disabled:opacity-50"
  >
    Previous
  </button>

  <span className="font-bold text-lg">
    Page {page}
  </span>

  <button
  disabled={!hasMore}
  onClick={() => setPage(page + 1)}
  className={`px-5 py-2 rounded text-white ${
    hasMore
      ? "bg-blue-600 hover:bg-blue-700"
      : "bg-gray-400 cursor-not-allowed"
  }`}
>
  Next
</button>

</div>

{showEditModal && editingProduct && (

<div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">

  <div className="bg-white rounded-xl p-8 w-[600px]">

    <h2 className="text-2xl font-bold mb-6">
      Edit Product
    </h2>

    <div className="space-y-4">

      <input
        type="text"
        value={editingProduct.product_name}
        onChange={(e) =>
          setEditingProduct({
            ...editingProduct,
            product_name: e.target.value,
          })
        }
        className="w-full border rounded-lg p-3"
        placeholder="Product Name"
      />

      <select
  value={editingProduct.brand_name}
  onChange={(e) =>
    setEditingProduct({
      ...editingProduct,
      brand_name: e.target.value,
    })
  }
  className="w-full border rounded-lg p-3"
>
  {brands.map((brand) => (
    <option key={brand} value={brand}>
      {brand}
    </option>
  ))}
</select>

<input
  type="text"
  value={editingProduct.category}
  onChange={(e) =>
    setEditingProduct({
      ...editingProduct,
      category: e.target.value,
    })
  }
  className="w-full border rounded-lg p-3"
  placeholder="Category"
/>

<input
  type="text"
  value={editingProduct.skin_type}
  onChange={(e) =>
    setEditingProduct({
      ...editingProduct,
      skin_type: e.target.value,
    })
  }
  className="w-full border rounded-lg p-3"
  placeholder="Skin Type"
/>

<input
  type="text"
  value={editingProduct.skin_concern}
  onChange={(e) =>
    setEditingProduct({
      ...editingProduct,
      skin_concern: e.target.value,
    })
  }
  className="w-full border rounded-lg p-3"
  placeholder="Skin Concern"
/>

<input
  type="text"
  value={editingProduct.image_name}
  onChange={(e) =>
    setEditingProduct({
      ...editingProduct,
      image_name: e.target.value,
    })
  }
  className="w-full border rounded-lg p-3"
  placeholder="Image Name"
/>

<input
  type="text"
  value={editingProduct.product_url}
  onChange={(e) =>
    setEditingProduct({
      ...editingProduct,
      product_url: e.target.value,
    })
  }
  className="w-full border rounded-lg p-3"
  placeholder="Product URL"
/>

      <select
  value={editingProduct.primary_category}
  onChange={(e) =>
    setEditingProduct({
      ...editingProduct,
      primary_category: e.target.value,
    })
  }
  className="w-full border rounded-lg p-3"
>
  {categories.map((category) => (
    <option key={category} value={category}>
      {category}
    </option>
  ))}
</select>

      <input
        type="number"
        value={editingProduct.price}

onChange={(e) =>
  setEditingProduct({
    ...editingProduct,
    price: e.target.value,
  })
}
        className="w-full border rounded-lg p-3"
        placeholder="Price"
      />

      <input
        type="number"
        step="0.1"
        value={editingProduct.rating}
        onChange={(e) =>
          setEditingProduct({
            ...editingProduct,
            rating: e.target.value,
          })
        }
        className="w-full border rounded-lg p-3"
        placeholder="Rating"
      />

      <div className="flex gap-6 mt-4">

  <label className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={editingProduct.new}
      onChange={(e) =>
        setEditingProduct({
          ...editingProduct,
          new: e.target.checked,
        })
      }
    />
    New
  </label>

  

  <label className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={editingProduct.out_of_stock}
      onChange={(e) =>
        setEditingProduct({
          ...editingProduct,
          out_of_stock: e.target.checked,
        })
      }
    />
    Out of Stock
  </label>

</div>

    </div>

    <div className="flex justify-end gap-3 mt-6">

      <button
        onClick={() => setShowEditModal(false)}
        className="bg-gray-500 text-white px-5 py-2 rounded-lg"
      >
        Cancel
      </button>

      <button
        onClick={handleUpdate}
        className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
      >
        Save Changes
      </button>

    </div>

  </div>

</div>

)}
        </Layout>
  ) ;
    
}

export default Products;