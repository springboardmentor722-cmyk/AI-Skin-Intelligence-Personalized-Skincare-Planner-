import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import Stats from "../components/landing/Stats";
import Features from "../components/landing/Features";
import HowItWorks from "../components/landing/HowItWorks";
import CTA from "../components/landing/CTA";
import Footer from "../components/landing/Footer";
import About from "../components/landing/About";
import Contact from "../components/landing/Contact";
import "../styles/landing.css";

function Landing() {
  return (
    <>
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <About />
      <Contact />
      <CTA />
      <Footer />
    </>
  );
}

export default Landing;