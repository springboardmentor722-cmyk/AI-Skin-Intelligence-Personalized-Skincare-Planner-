import { useNavigate } from "react-router-dom";
import {
    FaBell,
    FaSearch,
    FaChevronDown
} from "react-icons/fa";

import "../styles/navbar.css";

function Navbar() {

    const navigate = useNavigate();

    const role = localStorage.getItem("role");
    const name = localStorage.getItem("name");

    const logout = () => {

        localStorage.clear();

        navigate("/");

    };

    return (

        <div className="top-navbar">

            {/* Left */}

            <div className="navbar-left">

                <h2>

                    Welcome back,

                    <span>

                        {" "}

                        {name}

                    </span>

                </h2>

                <p>

                    AI Powered Personalized Skincare Platform

                </p>

            </div>

            {/* Right */}

            <div className="navbar-right">

                <div className="search-box">

                    <FaSearch />

                    <input
                        placeholder="Search..."
                    />

                </div>

                <div className="notification">

                    <FaBell />

                </div>

                <div className="profile-box">

                    <div className="avatar">

                        {name?.charAt(0).toUpperCase()}

                    </div>

                    <div>

                        <h6>

                            {name}

                        </h6>

                        <small>

                            {role}

                        </small>

                    </div>

                    <FaChevronDown />

                </div>

                <button
                    className="logout-button"
                    onClick={logout}
                >

                    Logout

                </button>

            </div>

        </div>

    );

}

export default Navbar;