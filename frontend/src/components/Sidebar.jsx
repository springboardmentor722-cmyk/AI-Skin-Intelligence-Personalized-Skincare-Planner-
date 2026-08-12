import { NavLink, useNavigate } from "react-router-dom";
import {
    FaHome,
    FaUser,
    FaLeaf,
    FaBoxOpen,
    FaChartLine,
    FaTint,
    FaHeartbeat,
    FaUsers,
    FaUserCheck,
    FaSignOutAlt,
    FaUserMd
} from "react-icons/fa";

import "../styles/sidebar.css";

function Sidebar() {

    const navigate = useNavigate();

    const role = localStorage.getItem("role");
    const name = localStorage.getItem("name");

    const logout = () => {

        localStorage.clear();

        navigate("/");

    };

return (
    <div className="sidebar">

        {/* Logo */}
        <div>

            <div className="sidebar-logo">

                <div className="logo-circle">
                    🌸
                </div>

                <h3>Skin Intelligence</h3>

                <p>
                    Welcome,
                    <br />
                    <strong>{name}</strong>
                </p>

            </div>

            {/* ================= USER ================= */}

            {role === "USER" && (
                <>

                    <NavLink to="/dashboard" className="menu-item">
                        <FaHome />
                        <span>Dashboard</span>
                    </NavLink>

                    <NavLink to="/profile" className="menu-item">
                        <FaUser />
                        <span>My Profile</span>
                    </NavLink>

                    <NavLink to="/skin-profile" className="menu-item">
                        <FaTint />
                        <span>Skin Profile</span>
                    </NavLink>

                    <NavLink to="/lifestyle" className="menu-item">
                        <FaHeartbeat />
                        <span>Lifestyle</span>
                    </NavLink>

                    <NavLink to="/products" className="menu-item">
                        <FaBoxOpen />
                        <span>Products</span>
                    </NavLink>

                    <NavLink to="/ingredients" className="menu-item">
                        <FaLeaf />
                        <span>Ingredients</span>
                    </NavLink>

                    <NavLink to="/progress" className="menu-item">
                        <FaChartLine />
                        <span>Progress</span>
                    </NavLink>

                    <NavLink to="/consult-experts" className="menu-item">
                        <FaUserMd />
                        <span>Consultations</span>
                    </NavLink>

                    <NavLink to="/my-consultation" className="menu-item">
                        <FaUserCheck />
                        <span>My Consultation</span>
                    </NavLink>

                    <NavLink to="/reports" className="menu-item">
                        <FaUserCheck />
                        <span>Reports</span>
                    </NavLink>

                </>
            )}

            {/* ================= CONSULTANT ================= */}

            {role === "CONSULTANT" && (
                <>

                    <NavLink to="/dashboard" className="menu-item">
                        <FaHome />
                        <span>Dashboard</span>
                    </NavLink>

                    <NavLink to="/profile" className="menu-item">
                        <FaUser />
                        <span>Professional Profile</span>
                    </NavLink>

                    <NavLink to="/products" className="menu-item">
                        <FaBoxOpen />
                        <span>Products</span>
                    </NavLink>

                    <NavLink to="/ingredients" className="menu-item">
                        <FaLeaf />
                        <span>Ingredients</span>
                    </NavLink>

                    <NavLink to="/pending-requests" className="menu-item">
                        <FaUserCheck />
                        <span>Consultation Requests</span>
                    </NavLink>

                    <NavLink to="/consultant/clients" className="menu-item">
                        <FaUsers />
                        <span>Clients</span>
                    </NavLink>

                </>
            )}

            {/* ================= DERMATOLOGIST ================= */}

            {role === "DERMATOLOGIST" && (
                <>

                    <NavLink to="/dashboard" className="menu-item">
                        <FaHome />
                        <span>Dashboard</span>
                    </NavLink>

                    <NavLink to="/profile" className="menu-item">
                        <FaUser />
                        <span>Professional Profile</span>
                    </NavLink>

                    <NavLink to="/products" className="menu-item">
                        <FaBoxOpen />
                        <span>Products</span>
                    </NavLink>

                    <NavLink to="/ingredients" className="menu-item">
                        <FaLeaf />
                        <span>Ingredients</span>
                    </NavLink>

                    <NavLink to="/pending-requests" className="menu-item">
                        <FaUserCheck />
                        <span>Consultation Requests</span>
                    </NavLink>

                    <NavLink to="/reports" className="menu-item">
                        <FaUserCheck />
                        <span>Reports</span>
                    </NavLink>

                </>
            )}

            {/* ================= ADMIN ================= */}

            {role === "ADMIN" && (
                <>

                    <NavLink to="/dashboard" className="menu-item">
                        <FaHome />
                        <span>Dashboard</span>
                    </NavLink>

                    <NavLink to="/manage-users" className="menu-item">
                        <FaUsers />
                        <span>Manage Users</span>
                    </NavLink>

                    <NavLink to="/pending-users" className="menu-item">
                        <FaUserCheck />
                        <span>Pending Users</span>
                    </NavLink>

                    <NavLink to="/manage-products" className="menu-item">
                        <FaBoxOpen />
                        <span>Manage Products</span>
                    </NavLink>

                    <NavLink to="/manage-ingredients" className="menu-item">
                        <FaLeaf />
                        <span>Manage Ingredients</span>
                    </NavLink>

                </>
            )}

        </div>

        <button
            className="logout-btn"
            onClick={logout}
        >
            <FaSignOutAlt />
            Logout
        </button>

    </div>
);

}

export default Sidebar;

