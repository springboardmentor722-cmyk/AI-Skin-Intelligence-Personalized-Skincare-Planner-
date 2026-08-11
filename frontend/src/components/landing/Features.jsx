import {
  FaRobot,
  FaChartLine,
  FaUserMd,
  FaShieldAlt,
} from "react-icons/fa";

const features = [
  {
    icon: <FaRobot />,
    title: "AI Skin Analysis",
    text: "Analyze your skin using intelligent AI models for quick and reliable insights.",
  },
  {
    icon: <FaChartLine />,
    title: "Progress Tracking",
    text: "Monitor your skincare journey with reports and visual progress tracking.",
  },
  {
    icon: <FaUserMd />,
    title: "Dermatologist Support",
    text: "Connect with certified dermatologists whenever expert advice is needed.",
  },
  {
    icon: <FaShieldAlt />,
    title: "Secure & Private",
    text: "Your health information is encrypted and protected at every step.",
  },
];

function Features() {
  return (
    <section className="features-section" id="features">
      <div className="section-title">
        <span>FEATURES</span>
        <h2>Everything You Need For Better Skin</h2>
        <p>
          Powered by Artificial Intelligence to provide personalized skincare
          recommendations.
        </p>
      </div>

      <div className="features-grid">
        {features.map((item, index) => (
          <div className="feature-card" key={index}>
            <div className="feature-icon">{item.icon}</div>

            <h3>{item.title}</h3>

            <p>{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Features;