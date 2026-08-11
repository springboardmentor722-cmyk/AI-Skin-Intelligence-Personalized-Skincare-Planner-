import { Link } from "react-router-dom";
import { FaSpa } from "react-icons/fa";

function Navbar() {
  return (
    <header className="landing-navbar">

      <div className="logo">

        <FaSpa className="logo-icon"/>

        <h2>DermaAI</h2>

      </div>

      <nav>

        <a href="#features">Features</a>

        <a href="#how">How it Works</a>

        <a href="#about">About</a>

        <a href="#contact">Contact</a>

      </nav>

      <div className="nav-buttons">

        <Link
          to="/login"
          className="login-btn"
        >
          Login
        </Link>

        <Link
          to="/register"
          className="start-btn"
        >
          Get Started→
        </Link>

      </div>

    </header>
  );
}

export default Navbar;