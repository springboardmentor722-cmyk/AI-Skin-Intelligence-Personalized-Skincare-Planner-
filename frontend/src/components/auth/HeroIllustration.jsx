import leaf from "../../assets/images/leaf.png";
import skincareproducts from "../../assets/images/skincare-products.png";

export default function HeroIllustration() {
  return (
    <div className="relative w-full h-[760px] flex items-center justify-center">

      {/* Background Glow */}
      <div className="absolute w-[420px] h-[420px] rounded-full bg-gradient-to-br from-green-100 via-emerald-50 to-white blur-sm"></div>

      {/* Decorative Circles */}

      <div className="absolute top-14 left-20 w-5 h-5 rounded-full bg-green-300"></div>

      <div className="absolute top-32 right-10 w-8 h-8 rounded-full bg-emerald-300"></div>

      <div className="absolute bottom-20 left-10 w-6 h-6 rounded-full bg-green-200"></div>

      <div className="absolute bottom-12 right-20 w-4 h-4 rounded-full bg-emerald-400"></div>

      {/* Leaf Image */}

      <img
        src={leaf}
        alt="Leaf"
        className="
          absolute
          top-0
          rounded-xl
          left-1/2
          -translate-x-1/2
          w-[360px]
          object-contain
          select-none
          pointer-events-none
          z-10
        "
      />

      {/* Product Image */}

      <img
        src={skincareproducts}
        alt="Products"
        className="
          absolute
          bottom-0
          rounded-xl
          left-1/2
          -translate-x-1/2
          w-[330px]
          object-contain
          z-20
          drop-shadow-[0_35px_60px_rgba(0,0,0,0.20)]
          hover:scale-105
          transition-all
          duration-500
        "
      />

      {/* Floating Card 1 */}

      <div
        className="
          absolute
          top-24
          right-2
          bg-white
          rounded-2xl
          shadow-xl
          px-5
          py-3
          z-30
        "
      >
        <p className="text-sm text-gray-500">
          AI Accuracy
        </p>

        <h3 className="text-2xl font-bold text-green-700">
          98%
        </h3>
      </div>

      {/* Floating Card 2 */}

      <div
        className="
          absolute
          bottom-60
          left-0
          bg-white
          rounded-2xl
          shadow-xl
          px-5
          py-3
          z-30
        "
      >
        <p className="text-sm text-gray-500">
          Products
        </p>

        <h3 className="text-2xl font-bold text-green-700">
          8493+
        </h3>
      </div>

      {/* Floating Card 3 */}

      <div
  className="
    absolute
    bottom-10
    right-4
    bg-white
    rounded-2xl
    shadow-xl
    px-5
    py-3
    z-30
  "
>
        <p className="text-sm text-gray-500">
          Ingredients
        </p>

        <h3 className="text-2xl font-bold text-green-700">
          2500+
        </h3>
      </div>

    </div>
  );
}