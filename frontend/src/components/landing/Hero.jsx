import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaRobot,
  FaChartLine,
  FaShieldAlt
} from "react-icons/fa";
import "../../styles/hero.css";

function Hero() {

  return (

<section className="hero">

<div className="hero-left">

<span className="hero-badge">

AI Powered Skincare

</span>

<h1>

Understand Your Skin

<br/>

<span>With AI Precision.</span>

</h1>

<p>

Analyze your skin, receive personalized skincare recommendations,
track your progress and connect with certified dermatologists—
all powered by intelligent AI.

</p>

<div className="hero-buttons">

<Link
to="/register"
className="hero-primary"
>

Start Analysis

<FaArrowRight/>

</Link>

<a
href="#features"
className="hero-secondary"
>

Explore Features

</a>

</div>

<div className="hero-stats">

<div>

<h3>15K+</h3>

<span>Users</span>

</div>

<div>

<h3>98%</h3>

<span>Accuracy</span>

</div>

<div>

<h3>24/7</h3>

<span>Support</span>

</div>

</div>

</div>

<div className="hero-right">

    <div className="hero-visual">

        <div className="scan-circle">

            <div className="scan-ring"></div>
            <div className="scan-ring second"></div>

            <div className="face-circle">

                😊

            </div>

        </div>

        <div className="info-card analysis">

            <FaRobot />

            <div>

                <h4>AI Analysis</h4>

                <span>98% Accuracy</span>

            </div>

        </div>

        <div className="info-card progress">

            <FaChartLine />

            <div>

                <h4>Progress</h4>

                <span>Weekly Tracking</span>

            </div>

        </div>

        <div className="info-card privacy">

            <FaShieldAlt />

            <div>

                <h4>Privacy</h4>

                <span>100% Secure</span>

            </div>

        </div>

    </div>

</div>
</section>

  );

}

export default Hero;