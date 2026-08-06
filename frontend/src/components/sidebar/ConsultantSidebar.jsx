import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaClipboardList,
  FaBell,
  FaSignOutAlt,
} from "react-icons/fa";
import { FaUserMd } from "react-icons/fa";

function ConsultantSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");

    navigate("/");
  };

  const menu = [
    {
      title: "Dashboard",
      icon: <FaTachometerAlt />,
      path: "/consultant/dashboard",
    },
    {
      title: "Appointment Requests",
      icon: <FaClipboardList />,
      path: "/consultant/appointments",
    },

    {
      title: "Patient Monitoring",
      icon: <FaUserMd />,
      path: "/consultant/monitoring",
},

    {
      title: "Notifications",
      icon: <FaBell />,
      path: "/consultant/notifications",
    },
  ];

  return (
    <div className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">

      <div className="p-6 border-b border-gray-700">

        <h1 className="text-2xl font-bold">
         🩺 AI Skin
        </h1>

        <p className="text-sm text-gray-400 mt-1">
         Consultant Workspace
        </p>

      </div>

      <nav className="flex-1 p-4">

        {menu.map((item) => (

          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-3 transition ${
              location.pathname === item.path
                ? "bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg"
                : "hover:bg-gray-800"
            }`}
          >
            <span className="text-lg">{item.icon}</span>

            <span>{item.title}</span>

          </Link>

        ))}

      </nav>

      <div className="p-4 border-t border-gray-700">

        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-red-500 hover:bg-red-600 shadow-md transition"
        >
          <FaSignOutAlt />

          Logout
        </button>

      </div>

    </div>
  );
}

export default ConsultantSidebar;