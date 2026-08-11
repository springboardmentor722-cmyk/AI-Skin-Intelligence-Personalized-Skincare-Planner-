import { FaSpa } from "react-icons/fa";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-logo">
        <FaSpa />

        <h3>AI Skin Intelligence</h3>
      </div>

      <p>
        Personalized skincare powered by Artificial Intelligence.
      </p>

      <span>
        © 2026 AI Skin Intelligence. All Rights Reserved.
      </span>
    </footer>
  );
}

export default Footer;