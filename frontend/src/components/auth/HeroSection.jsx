import {
  Brain,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import logo from "../../assets/logo/logo.png";

export default function HeroSection() {
  return (
    <div className="w-full max-w-[620px]">

      {/* Logo */}

      <div className="flex items-center gap-4 mb-14">

        <img
          src={logo}
          alt="AI Skin Intelligence"
          className="w-16 h-16 object-contain"
        />

        <div>
          <h2 className="text-4xl font-bold text-green-800">
            AI Skin
          </h2>

          <p className="text-gray-500 text-xl">
            Intelligence
          </p>
        </div>

      </div>

      {/* Heading */}

      <h1 className="text-[64px] leading-[74px] font-extrabold text-gray-900">

        Smart AI for

        <span className="block text-green-700">
          Healthier Skin
        </span>

      </h1>

      <div className="w-28 h-1.5 rounded-full bg-gradient-to-r from-green-700 to-emerald-400 mt-8 mb-8"></div>

      {/* Description */}

      <p className="text-gray-600 text-xl leading-9 max-w-[560px]">

        Analyze your skin using Artificial Intelligence,

        discover powerful skincare ingredients,

        receive personalized product recommendations,

        and track your skincare journey effortlessly.

      </p>

      {/* Features */}

      <div className="mt-14 space-y-8">

        <FeatureCard
          icon={<Brain size={28} />}
          title="AI Skin Analysis"
          desc="Advanced AI identifies skin conditions accurately."
        />

        <FeatureCard
          icon={<Sparkles size={28} />}
          title="Personalized Routine"
          desc="Receive a skincare routine made specifically for you."
        />

        <FeatureCard
          icon={<TrendingUp size={28} />}
          title="Track Progress"
          desc="Compare your improvements and monitor skin health."
        />

      </div>

    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="flex items-start gap-5">

      <div className="
        w-16
        h-16
        rounded-2xl
        bg-green-100
        flex
        items-center
        justify-center
        text-green-700
        shadow-lg
        shrink-0
      ">
        {icon}
      </div>

      <div>

        <h3 className="text-xl font-semibold text-gray-800">
          {title}
        </h3>

        <p className="text-gray-500 mt-2 leading-7">
          {desc}
        </p>

      </div>

    </div>
  );
}