import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";

import {
  getProductById,
  searchProducts,
} from "../services/productService";


function ProductDetails() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);


  useEffect(() => {

    const fetchProduct = async () => {

      try {

        const data = await getProductById(id);

        setProduct(data);


        // Related products from same category

        const related = await searchProducts({
          category: data.category,
        });


        setRelatedProducts(
          related
            .filter(
              (item) =>
                item.product_id !== data.product_id
            )
            .slice(0, 4)
        );


      } catch (error) {

        console.error(
          "Error fetching product:",
          error
        );

      }

    };


    fetchProduct();

  }, [id]);



  if (!product) {

    return (

      <DashboardLayout>

        <div className="text-center py-20 text-lg">

          Loading Product...

        </div>

      </DashboardLayout>

    );

  }



  return (

    <DashboardLayout>


      <div className="mb-6">

        <button

          onClick={() =>
            navigate("/products")
          }

          className="
          bg-blue-600 
          text-white 
          px-6 
          py-3 
          rounded-xl
          hover:bg-blue-700
          transition
          "

        >

          ← Back to Products

        </button>


      </div>



      <div className="
      bg-white
      rounded-2xl
      shadow-lg
      overflow-hidden
      ">



        {/* Main Product Section */}


        <div className="
        grid
        md:grid-cols-2
        gap-10
        p-8
        ">



          {/* Product Image */}


          <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-6 h-[560px]  shadow-sm flex justify-center">

            {product.image_url ? (

    <img
        src={product.image_url}
        alt={product.product_name}
        className="w-[320px] h-[520px] object-contain rounded-2xl"
    />

) : (

    <div className="w-[480px] h-[520px] rounded-2xl bg-gradient-to-br from-blue-50 to-gray-100 flex flex-col items-center justify-center">

        <div className="text-8xl font-bold text-blue-600">
            {product.category?.charAt(0)}
        </div>

        <p className="mt-4 text-4xl font-semibold text-gray-600">
            {product.category}
        </p>

    </div>

)}


          </div>




          {/* Product Information */}



          <div className="space-y-6">



            <div>

  <span className="inline-block bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-sm font-medium">
    {product.category}
  </span>

  <h1 className="text-4xl font-extrabold text-gray-900 mt-4 leading-tight">
    {product.product_name}
  </h1>

  <p className="text-2xl text-gray-500 mt-3">
    {product.brand_name}
  </p>

</div>





            {/* Rating */}


            <div className="flex items-center gap-3">


              <span className="
              text-yellow-500
              text-xl
              ">

                {"★".repeat(
                  Math.round(product.rating || 0)
                )}

                {"☆".repeat(
                  5 -
                  Math.round(product.rating || 0)
                )}

              </span>



              <span className="
              font-semibold
              text-gray-700
              ">

                {product.rating
                  ? Number(product.rating).toFixed(1)
                  : "N/A"
                }


              </span>


            </div>




            {/* Price */}



           <div className="bg-green-50 border border-green-200 rounded-2xl p-4 w-fit">

    <p className="text-sm text-gray-500">
        Price
    </p>

   <h2 className="text-3xl font-bold text-green-700">
        ${product.price}
    </h2>

</div>




            {/* Product Information Cards */}



            <div className="
            grid
            grid-cols-2
            gap-4
            ">


              <InfoCard
                title="Category"
                value={product.category}
              />


              <InfoCard
                title="Skin Type"
                value={product.skin_type}
              />


              <InfoCard
                title="Skin Concern"
                value={product.skin_concern}
              />


              <InfoCard
                title="Brand"
                value={product.brand_name}
              />


            </div>




            {/* Product URL */}



            {
              product.product_url && (

                <a

                  href={product.product_url}

                  target="_blank"

                  rel="noopener noreferrer"


                  className="
                  inline-block
                  bg-blue-600
                  text-white
                  px-8
                  py-3
                  rounded-xl
                  font-semibold
                  hover:bg-blue-700
                  transition
                  "

                >

                  View Product


                </a>

              )

            }



          </div>



        </div>






        {/* Description */}



        <Section

          title="Description"

          content={product.description}

        />





        {/* Ingredients */}



        <Section

          title="Ingredients"

          content={product.ingredients}

        />






        {/* Usage */}



        <Section

          title="How to Use"

          content={product.usage}

        />
        <br></br>







        {/* Related Products */}



        <div className="
        border-t
        p-8
        ">


          <h2 className="
          text-2xl
          font-bold
          mb-6
          ">

            Related Products

          </h2>



          <div className="
          grid
          grid-cols-1
          md:grid-cols-2
          lg:grid-cols-4
          gap-6
          ">



          {
            relatedProducts.map((item)=>(


              <div

                key={item.product_id}

                onClick={()=>navigate(
                  `/products/${item.product_id}`
                )}

                className="
                cursor-pointer
                bg-gray-100
                rounded-xl
                p-4
                hover:shadow-lg
                transition
                "


              >



                <img
    src={
        item.image_url ||
        `https://placehold.co/300x300/F5F5F5/6B7280?text=${item.category}`
    }

                />



                <h3 className="
                font-bold
                mt-3
                line-clamp-2
                ">

                  {item.product_name}

                </h3>



                <p className="
                text-gray-500
                text-sm
                ">

                  {item.brand_name}

                </p>



                <p className="
                text-green-600
                font-bold
                mt-2
                ">

                  ${item.price}

                </p>


              </div>


            ))

          }



          </div>


        </div>




      </div>



    </DashboardLayout>

  );

}





function InfoCard({ title, value }) {

  return (

    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 hover:bg-white transition">

        <p className="text-gray-500 text-sm uppercase tracking-wide">

            {title}

        </p>

        <h3 className="mt-3 text-lg font-semibold text-gray-800">

            {value || "N/A"}

        </h3>

    </div>

  );

}





function Section({ title, content }) {
  return (
    <div className="mt-8 mx-8 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

      <div className="bg-gray-50 px-6 py-4 border-b">
        <h2 className="text-xl font-bold text-gray-800">
          {title}
        </h2>
      </div>

      <div className="p-6">
        <p className="text-gray-700 leading-8 whitespace-pre-wrap text-justify">
          {content || "Information not available."}
        </p>
      </div>

    </div>
  );
}




export default ProductDetails;