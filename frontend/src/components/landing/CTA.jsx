import { Link } from "react-router-dom";

function CTA() {
  return (
    <section className="cta-section">
      <div className="cta-box">
        <h2>Start Your AI Skincare Journey Today</h2>

        <p>
          Discover personalized skincare recommendations with intelligent AI
          analysis.
        </p>

        <Link to="/register" className="cta-btn">
          Get Started
        </Link>
      </div>
    </section>
  );
}

export default CTA;