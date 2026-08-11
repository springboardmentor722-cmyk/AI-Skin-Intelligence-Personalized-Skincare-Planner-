import {

FaRobot,

FaLeaf,

FaUserMd,

FaChartLine

} from "react-icons/fa";

import "../styles/features.css";

function Features() {

return(

<section

id="features"

className="features"

>

<h2>

Everything You Need For Healthy Skin

</h2>

<div className="feature-grid">

<div className="feature-card">

<FaRobot/>

<h3>

AI Skin Analysis

</h3>

<p>

Personalized skincare recommendations.

</p>

</div>

<div className="feature-card">

<FaUserMd/>

<h3>

Expert Consultation

</h3>

<p>

Connect with verified consultants.

</p>

</div>

<div className="feature-card">

<FaLeaf/>

<h3>

Ingredient Checker

</h3>

<p>

Understand every skincare ingredient.

</p>

</div>

<div className="feature-card">

<FaChartLine/>

<h3>

Progress Tracking

</h3>

<p>

Track your skincare journey.

</p>

</div>

</div>

</section>

);

}

export default Features;