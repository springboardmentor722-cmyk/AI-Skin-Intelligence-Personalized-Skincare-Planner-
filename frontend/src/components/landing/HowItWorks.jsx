import {
  FaCamera,
  FaRobot,
  FaClipboardList,
  FaSmileBeam,
} from "react-icons/fa";

const steps = [
  {
    icon: <FaCamera />,
    title: "Upload",
    desc: "Upload your skin image securely.",
  },
  {
    icon: <FaRobot />,
    title: "AI Analysis",
    desc: "Our AI detects possible skin concerns.",
  },
  {
    icon: <FaClipboardList />,
    title: "Recommendations",
    desc: "Receive a personalized skincare routine.",
  },
  {
    icon: <FaSmileBeam />,
    title: "Track Progress",
    desc: "Monitor improvements with your dashboard.",
  },
];

function HowItWorks() {
  return (
    <section className="how-section" id="how">
      <div className="section-title">
        <span>HOW IT WORKS</span>

        <h2>Four Simple Steps</h2>
      </div>

      <div className="steps-grid">
        {steps.map((step, index) => (
          <div className="step-card" key={index}>
            <div className="step-number">0{index + 1}</div>

            <div className="step-icon">{step.icon}</div>

            <h3>{step.title}</h3>

            <p>{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default HowItWorks;