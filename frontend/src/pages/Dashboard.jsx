import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";

import {
    FaUsers,
    FaBoxOpen,
    FaLeaf,
    FaChartLine,
    FaArrowRight
} from "react-icons/fa";

import "../styles/dashboard.css";

function Dashboard() {

    const navigate = useNavigate();

    const role = localStorage.getItem("role");
    const name = localStorage.getItem("name");

    const [stats, setStats] = useState({});

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {

        try {

            const response = await api.get("/dashboard/stats");

            setStats(response.data);

        }

        catch (err) {

            console.log(err);

        }

    };

    return (

        <DashboardLayout>

            {/* Dashboard Hero */}

<div className="dashboard-hero">

    <div className="dashboard-hero-content">

        <h2>
            Welcome, {name} 👋
        </h2>

        <h4>
            {
                role === "USER"
                ? "Your Personal Skin Care Dashboard"
                : role === "CONSULTANT"
                ? "Skincare Consultant Dashboard"
                : role === "DERMATOLOGIST"
                ? "Dermatologist Dashboard"
                : "Administrator Dashboard"
            }
        </h4>

        <p>
            {
                role === "USER"
                ? "Track your skin health, receive AI-powered recommendations and monitor your skincare journey."
                : role === "CONSULTANT"
                ? "Manage skincare products, ingredients and provide professional guidance."
                : role === "DERMATOLOGIST"
                ? "Review patient records and monitor treatments."
                : "Manage users, monitor statistics and control the complete platform."
            }
        </p>

        <div className="hero-buttons">

            {role==="USER" && (
                <>
                    <button
                        className="primary-button"
                        onClick={()=>navigate("/skin-profile")}
                    >
                        Update Skin Profile
                    </button>

                    <button
                        className="secondary-button"
                        onClick={()=>navigate("/products")}
                    >
                        Explore Products
                    </button>
                </>
            )}

            {(role==="CONSULTANT" || role==="DERMATOLOGIST") && (
                <>
                    <button
                        className="primary-button"
                        onClick={()=>navigate("/products")}
                    >
                        Products
                    </button>

                    <button
                        className="secondary-button"
                        onClick={()=>navigate("/ingredients")}
                    >
                        Ingredients
                    </button>
                </>
            )}

            {role==="ADMIN" && (
                <>
                    <button
                        className="primary-button"
                        onClick={()=>navigate("/manage-users")}
                    >
                        Manage Users
                    </button>

                    <button
                        className="secondary-button"
                        onClick={()=>navigate("/pending-users")}
                    >
                        Pending Users
                    </button>
                </>
            )}

        </div>

    </div>

    <div className="dashboard-hero-image">

        <img
    src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=900&auto=format&fit=crop"
    alt="Dashboard"
/>

    </div>

</div>

            {/* Statistics */}

            <div className="row mt-5">
                {role==="ADMIN" && (

<>
<Card
title="Users"
icon={<FaUsers/>}
value="100+"
/>

<Card
title="Products"
icon={<FaBoxOpen/>}
value="1000+"
/>

<Card
title="Ingredients"
icon={<FaLeaf/>}
value="1000+"
/>

<Card
title="Progress"
icon={<FaChartLine/>}
value={stats.total_progress}
/>

</>

)}
                {role==="USER" && (

<>
<Card
title="Skin Profiles"
icon={<FaUsers/>}
value={stats.skin_profiles}
/>

<Card
title="Lifestyle"
icon={<FaChartLine/>}
value={stats.lifestyle}
/>

<Card
title="Progress"
icon={<FaChartLine/>}
value={stats.progress}
/>

<Card
title="Products"
icon={<FaBoxOpen/>}
value={stats.products}
/>

</>

)}

               {(role==="CONSULTANT" || role==="DERMATOLOGIST") && (

<>
<Card
title="Products"
icon={<FaBoxOpen/>}
value={stats.products}
/>

<Card
title="Ingredients"
icon={<FaLeaf/>}
value={stats.ingredients}
/>

<Card
title="Approved Users"
icon={<FaUsers/>}
value={stats.approved_users}
/>

<Card
title="Pending Users"
icon={<FaUsers/>}
value={stats.pending_users}
/>

</>

)}


            </div>

            <div className="row mt-4">

                {/* Recent Activity */}

                <div className="col-lg-7">

                    <div className="activity-card">

                        <h4>

                            Recent Activity

                        </h4>

                        <ul>

                            {

                                role === "USER" &&

                                <>

                                    <li>✔ Updated Skin Profile</li>

                                    <li>✔ Lifestyle Assessment</li>

                                    <li>✔ AI Product Recommendations</li>

                                    <li>✔ Progress Tracking</li>

                                </>

                            }

                            {

                                role === "CONSULTANT" &&

                                <>

                                    <li>✔ Professional Profile</li>

                                    <li>✔ Products Library</li>

                                    <li>✔ Ingredients Database</li>

                                    <li>✔ Recommendation Support</li>

                                </>

                            }

                            {

                                role === "DERMATOLOGIST" &&

                                <>

                                    <li>✔ Professional Profile</li>

                                    <li>✔ Medical License Verified</li>

                                    <li>✔ Ingredients Library</li>

                                    <li>✔ Product Database</li>

                                </>

                            }

                            {

                                role === "ADMIN" &&

                                <>

                                    <li>✔ Manage Users</li>

                                    <li>✔ Pending Approvals</li>

                                    <li>✔ Dashboard Statistics</li>

                                    <li>✔ System Monitoring</li>

                                </>

                            }

                        </ul>

                    </div>

                </div>

                {/* Quick Actions */}

                <div className="col-lg-5">

                    <div className="quick-card">

                        <h4>

                            Quick Actions

                        </h4>

                        {

                            role === "USER" &&

                            <>

                                <button onClick={() => navigate("/skin-profile")}>

                                    Skin Profile <FaArrowRight />

                                </button>

                                <button onClick={() => navigate("/lifestyle")}>

                                    Lifestyle <FaArrowRight />

                                </button>

                                <button onClick={() => navigate("/products")}>

                                    Products <FaArrowRight />

                                </button>

                                <button onClick={() => navigate("/progress")}>

                                    Progress <FaArrowRight />

                                </button>

                            </>

                        }

                        {

                            (role === "CONSULTANT" || role === "DERMATOLOGIST") &&

                            <>

                                <button onClick={() => navigate("/profile")}>

                                    My Profile <FaArrowRight />

                                </button>

                                <button onClick={() => navigate("/products")}>

                                    Products <FaArrowRight />

                                </button>

                                <button onClick={() => navigate("/ingredients")}>

                                    Ingredients <FaArrowRight />

                                </button>

                            </>

                        }

                        {

                            role === "ADMIN" &&

                            <>

                                <button onClick={() => navigate("/manage-users")}>

                                    Manage Users <FaArrowRight />

                                </button>

                                <button onClick={() => navigate("/pending-users")}>

                                    Pending Users <FaArrowRight />

                                </button>

                                <button onClick={() => navigate("/products")}>

                                    Products <FaArrowRight />

                                </button>

                                <button onClick={() => navigate("/ingredients")}>

                                    Ingredients <FaArrowRight />

                                </button>

                            </>

                        }

                    </div>

                </div>

            </div>

        </DashboardLayout>

    );

}

function Card({ icon, title, value }) {

    return (

        <div className="col-lg-3 col-md-6 mb-4">

            <div className="stat-card">

                <div className="icon">

                    {icon}

                </div>

                <h5>{title}</h5>

                <h2>{value ?? 0}</h2>

            </div>

        </div>

    );

}

export default Dashboard;
