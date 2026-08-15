import { RoleCard, FeatureCard } from "../components/Cards";
import "./Landing.css";

const FEATURES = [
  {
    icon: "🧬",
    title: "AI Skin Assessment",
    description: "Computer-vision skin analysis from a single photo.",
  },
  {
    icon: "🗂️",
    title: "Skin Profile",
    description: "Skin type, concerns, allergies, and sensitivity in one place.",
  },
  {
    icon: "🌙",
    title: "Lifestyle Tracking",
    description: "Sleep, hydration, stress, and sun exposure, logged over time.",
  },
  {
    icon: "🧴",
    title: "Routine Generator",
    description: "A morning and evening routine tailored to your profile.",
  },
  {
    icon: "🔬",
    title: "Ingredient Intelligence",
    description: "Know what's actually in your products, and why it matters.",
  },
  {
    icon: "🛍️",
    title: "Product Recommendation",
    description: "Suggestions matched to your skin type and budget.",
  },
  {
    icon: "📈",
    title: "Progress Tracking",
    description: "Watch your skin health score change month over month.",
    comingSoon: true,
  },
  {
    icon: "🩺",
    title: "Dermatologist Support",
    description: "Escalate concerns directly to a licensed dermatologist.",
  },
  {
    icon: "📊",
    title: "Analytics",
    description: "Deep insight into the habits shaping your skin.",
  },
];

const STEPS = [
  {
    title: "Build your profile",
    description: "Tell us your skin type, concerns, allergies, and current routine.",
  },
  {
    title: "Log your lifestyle",
    description: "Track sleep, hydration, stress, and sun exposure as you go.",
  },
  {
    title: "Get a personalized plan",
    description: "Future AI modules turn your data into a routine built for you.",
  },
];

const FAQS = [
  {
    q: "Is my skin and health data private?",
    a: "Yes. Your profile is protected behind authentication and is only ever visible to you and, if you choose to share it, your assigned consultant or dermatologist.",
  },
  {
    q: "Do I need to upload photos to get started?",
    a: "No. Milestone 1 is built entirely around your skin profile and lifestyle logs. Photo-based AI assessment arrives in a later milestone.",
  },
  {
    q: "Can dermatologists and consultants use this too?",
    a: "Yes — the platform has independent dashboards for Users, Skincare Consultants, Dermatologists, and Administrators.",
  },
];

export default function Landing() {
  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section className="hero section">
        <div className="container hero-inner">
          <span className="eyebrow">AI Skin Intelligence Platform</span>
          <h1 className="hero-title">
            AI Skin Intelligence &amp;<br />Personalized Skincare Planner
          </h1>
          <p className="hero-subtitle">
            One place for your skin profile, lifestyle, sleep, hydration, and environmental
            exposure — the foundation for a skincare plan built entirely around you.
          </p>
          <div className="hero-actions">
            <a href="#roles" className="btn btn-primary">
              Get started
            </a>
            <a href="#how-it-works" className="btn btn-ghost">
              See how it works
            </a>
          </div>
        </div>
        <div className="hero-orb" aria-hidden="true" />
      </section>

      {/* ---------------- Features ---------------- */}
      <section id="features" className="section">
        <div className="container">
          <span className="eyebrow">What's inside</span>
          <h2 className="section-title">A full skin-health picture, in one dashboard</h2>
          <div className="feature-grid">
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section id="how-it-works" className="section how-it-works">
        <div className="container">
          <span className="eyebrow">How it works</span>
          <h2 className="section-title">Three steps to a plan built for your skin</h2>
          <div className="steps-grid">
            {STEPS.map((s, i) => (
              <div className="glass-card step-card" key={s.title}>
                <span className="step-index">{String(i + 1).padStart(2, "0")}</span>
                <h3>{s.title}</h3>
                <p>{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Continue As ---------------- */}
      <section id="roles" className="section">
        <div className="container">
          <span className="eyebrow">Continue as</span>
          <h2 className="section-title">Choose how you use the platform</h2>
          <div className="roles-grid">
            <RoleCard
              icon="🙋"
              title="User"
              description="Build a skin profile and track your daily lifestyle."
              to="/register?role=User"
            />
            <RoleCard
              icon="💁"
              title="Skincare Consultant"
              description="Guide clients toward a routine that fits their skin."
              to="/register?role=Skincare Consultant"
            />
            <RoleCard
              icon="🩺"
              title="Dermatologist"
              description="Review patient records and support serious concerns."
              to="/register?role=Dermatologist"
            />
            <RoleCard
              icon="🛠️"
              title="Administrator"
              description="Manage users, roles, and platform-wide statistics."
              to="/register?role=Administrator"
            />
          </div>
        </div>
      </section>

      {/* ---------------- Testimonials placeholder ---------------- */}
      <section className="section testimonials">
        <div className="container">
          <span className="eyebrow">Early feedback</span>
          <h2 className="section-title">Testimonials</h2>
          <div className="glass-card testimonial-placeholder">
            <p>Real testimonials will appear here once the platform launches publicly.</p>
            <span className="badge badge-coming-soon">Coming Soon</span>
          </div>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section id="faq" className="section">
        <div className="container">
          <span className="eyebrow">FAQ</span>
          <h2 className="section-title">Good to know</h2>
          <div className="faq-list">
            {FAQS.map((item) => (
              <details className="glass-card faq-item" key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
