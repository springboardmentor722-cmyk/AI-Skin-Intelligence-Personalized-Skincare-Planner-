import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

import {
  FaSearch,
  FaBell,
  FaSignOutAlt,
  FaUserCircle,
} from "react-icons/fa";

function Navbar() {
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/auth/profile");
        setUser(response.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");

    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200 shadow-sm">

      <div className="h-20 px-8 flex items-center justify-between">

        {/* Left */}

        <div className="flex items-center gap-6">

          <h1 className="text-3xl font-bold text-green-700">
            AI Skin Intelligence
          </h1>

          {/* Search */}

          <div className="hidden lg:flex items-center bg-gray-100 rounded-2xl px-4 py-3 w-80">

            <FaSearch className="text-gray-400" />

            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent outline-none ml-3 w-full text-gray-700"
            />

          </div>

        </div>

        {/* Right */}

        <div className="flex items-center gap-5">

          {/* Notification */}

          <button className="relative w-12 h-12 rounded-2xl bg-gray-100 hover:bg-green-100 transition">

            <FaBell className="mx-auto text-green-700 mt-3" />

            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500"></span>

          </button>

          {/* User */}

          <div className="flex items-center gap-3 bg-green-50 rounded-2xl px-4 py-2">

            <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">

              <FaUserCircle className="text-white text-2xl" />

            </div>

            <div>

              <h3 className="font-semibold text-gray-800">

                {user ? user.full_name : "Loading..."}

              </h3>

              <p className="text-sm text-gray-500 capitalize">

                {user?.role}

              </p>

            </div>

          </div>

          {/* Logout */}

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-2xl shadow-lg transition"
          >

            <FaSignOutAlt />

            Logout

          </button>

        </div>

      </div>

    </header>
  );
}

export default Navbar;