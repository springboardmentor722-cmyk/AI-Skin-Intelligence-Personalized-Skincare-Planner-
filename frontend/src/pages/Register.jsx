import HeroSection from "../components/auth/HeroSection";
import HeroIllustration from "../components/auth/HeroIllustration";
import RegisterCard from "../components/auth/RegisterCard";

export default function Register() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#F8FFF9] via-[#F4FFF7] to-[#F8FFFC]">

      {/* Background Blur */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-green-200/30 blur-3xl"></div>

      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-emerald-200/20 blur-3xl"></div>

      {/* Decorative Dots */}
      <div className="absolute top-10 right-10 opacity-30">
        <div className="grid grid-cols-5 gap-3">
          {[...Array(25)].map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 rounded-full bg-green-700"
            ></div>
          ))}
        </div>
      </div>

      {/* Main Layout */}
      <div className="relative z-10 flex min-h-screen">

        {/* Left Side */}
        <div className="w-[60%] flex items-center px-16">

          <div className="grid grid-cols-[1fr_0.9fr] gap-14 items-center w-full">

            <HeroSection />

            <HeroIllustration />

          </div>

        </div>

        {/* Right Side */}

        <div className="w-[40%] flex items-center justify-center px-10">

          <RegisterCard />

        </div>

      </div>

    </div>
  );
}