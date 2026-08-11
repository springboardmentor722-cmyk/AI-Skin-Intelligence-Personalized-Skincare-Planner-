import {
    FaEnvelope,
    FaPhone,
    FaMapMarkerAlt
} from "react-icons/fa";

function Contact() {

    return (

<section className="contact-section" id="contact">

<div className="section-title">

<span>CONTACT</span>

<h2>We're Here to Help</h2>

</div>

<div className="contact-grid">

<div className="contact-card">

<FaEnvelope/>

<h3>Email</h3>

<p>support@dermaai.com</p>

</div>

<div className="contact-card">

<FaPhone/>

<h3>Phone</h3>

<p>+91 98765 43210</p>

</div>

<div className="contact-card">

<FaMapMarkerAlt/>

<h3>Location</h3>

<p>Hyderabad, India</p>

</div>

</div>

</section>

    );

}

export default Contact;