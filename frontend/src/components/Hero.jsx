import { Link } from "react-router-dom";

import "../styles/hero.css";

function Hero() {

    return (

        <section className="hero">

            <div className="hero-left">

                <h1>

                    AI Skin Intelligence

                </h1>

                <h2>

                    Personalized Skincare Powered by AI

                </h2>

                <p>

                    Discover your skin condition,

                    connect with dermatologists,

                    monitor progress,

                    and receive intelligent skincare recommendations

                    in one platform.

                </p>

                <div className="hero-buttons">

                    <Link

                        to="/register"

                        className="primary-btn"

                    >

                        Get Started

                    </Link>

                    <a

                        href="#features"

                        className="secondary-btn"

                    >

                        Learn More

                    </a>

                </div>

            </div>

            <div className="hero-right">

                <img

                    src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9"

                    alt="Skincare"

                />

            </div>

        </section>

    );

}

export default Hero;