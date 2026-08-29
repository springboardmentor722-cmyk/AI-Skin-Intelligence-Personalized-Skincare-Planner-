import { Link } from "react-router-dom";
import { TbSparkles, TbFlask2, TbChartDots, TbShieldCheck } from "react-icons/tb";
import SkinHealthRing from "../../components/SkinHealthRing";

const FEATURES = [
  {
    icon: <TbSparkles />,
    title: "Skin assessment",
    body: "A quick profile turns into a clear read on your skin type, concerns, and priorities.",
  },
  {
    icon: <TbFlask2 />,
    title: "Ingredient intelligence",
    body: "Know what's actually in your products and whether it suits your skin.",
  },
  {
    icon: <TbChartDots />,
    title: "Progress tracking",
    body: "Watch your skin health score move as your routine takes effect.",
  },
  {
    icon: <TbShieldCheck />,
    title: "Expert oversight",
    body: "Consultants and dermatologists can step in wherever you need them.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-8 py-5 max-w-[1100px] mx-auto">
        <span className="font-display text-lg font-semibold text-ocean-700">
          AI Skin Intelligence
        </span>
        <nav className="flex items-center gap-4">
          <Link to="/login" className="text-sm text-ink-secondary hover:text-ink-primary transition">
            Login
          </Link>
          <Link to="/register" className="btn-primary text-sm py-2 px-4">
            Register
          </Link>
        </nav>
      </header>

      <main className="max-w-[1100px] mx-auto px-8 pt-16 pb-24">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="animate-in">
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight mb-5">
              AI-powered,
              <br />
              <span className="text-ocean-500">personalized skincare</span>
            </h1>
            <p className="text-ink-secondary text-lg mb-8 max-w-md">
              Analyze your skin profile, lifestyle, and habits to get skincare
              recommendations built around you, not a generic routine.
            </p>
            <div className="flex gap-3">
              <Link to="/register" className="btn-primary">Get started</Link>
              <Link to="/login" className="btn-outline">Login</Link>
            </div>
          </div>

          <div className="animate-in delay-2 flex justify-center">
            <div className="glass p-10 flex flex-col items-center gap-4">
              <SkinHealthRing value={82} tone="sage" size={140} />
              <div className="text-center">
                <p className="font-medium text-ink-primary">Your skin health score</p>
                <p className="text-sm text-ink-secondary">Updated as your routine progresses</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mt-20">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`glass lift p-5 animate-in delay-${Math.min(i + 1, 5)}`}
            >
              <div className="w-10 h-10 rounded-full bg-ocean-100 text-ocean-600 flex items-center justify-center text-xl mb-3">
                {f.icon}
              </div>
              <h3 className="text-base font-medium mb-1">{f.title}</h3>
              <p className="text-sm text-ink-secondary">{f.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default Landing;
