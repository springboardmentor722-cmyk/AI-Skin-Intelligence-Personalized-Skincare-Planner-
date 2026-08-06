import { FaLeaf } from "react-icons/fa";

export default function WelcomeHero() {
  return (
    <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-green-700 via-emerald-600 to-green-500 p-8 mb-8 shadow-xl">

  {/* Background circles */}
  <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/10"></div>
  <div className="absolute bottom-0 right-40 w-32 h-32 rounded-full bg-white/5"></div>

  <div className="relative flex items-center justify-between">

    <div className="max-w-2xl">

      <p className="text-green-100 text-lg font-medium">
        👋 Welcome Back
      </p>

      <h1 className="text-5xl font-bold text-white mt-2">
        AI Skin Intelligence
      </h1>

      <p className="text-green-50 text-lg mt-4 leading-8">
        Analyze your skin, receive AI-powered recommendations,
        build healthy skincare routines and track your progress
        from one intelligent dashboard.
      </p>

    </div>

    <div className="hidden lg:flex items-center justify-center">

      <div className="w-32 h-32 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center">

        <FaLeaf className="text-white text-6xl" />

      </div>

    </div>

  </div>

</div>
  );
}