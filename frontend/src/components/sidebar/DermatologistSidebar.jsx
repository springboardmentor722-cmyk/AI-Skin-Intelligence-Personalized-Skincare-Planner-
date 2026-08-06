import { NavLink, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaClipboardList,
  FaUserInjured,
  FaBell,
  FaSignOutAlt,
  FaUserMd,
} from "react-icons/fa";

function DermatologistSidebar() {

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const menuClass = ({ isActive }) =>
    `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${
      isActive
        ? "bg-white text-teal-700 shadow-lg font-semibold"
        : "text-teal-50 hover:bg-teal-600"
    }`;

  return (
    <aside className="w-72 bg-gradient-to-b from-teal-700 to-cyan-800 text-white min-h-screen flex flex-col shadow-2xl">

      {/* Header */}
      <div className="p-6 border-b border-teal-500">

        <div className="flex items-center gap-3">

          <div className="bg-white text-teal-700 p-3 rounded-full">

            <FaUserMd className="text-2xl" />

          </div>

          <div>

            <h2 className="text-2xl font-bold">
              Dermatologist
            </h2>

            <p className="text-sm text-teal-100">
              Specialist Panel
            </p>

          </div>

        </div>

      </div>

      {/* Navigation */}
      <nav className="flex-1 p-5 space-y-3">

        <NavLink
          to="/dermatologist/dashboard"
          className={menuClass}
        >
          <FaHome />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/dermatologist/appointments"
          className={menuClass}
        >
          <FaClipboardList />
          <span>Appointments</span>
        </NavLink>

        <NavLink
          to="/dermatologist/patients"
          className={menuClass}
        >
          <FaUserInjured />
          <span>Patients</span>
        </NavLink>

        <NavLink
          to="/dermatologist/notifications"
          className={menuClass}
        >
          <FaBell />
          <span>Notifications</span>
        </NavLink>

      </nav>

      {/* Footer */}
      <div className="p-5 border-t border-teal-500">

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 bg-red-500 hover:bg-red-600 transition-all duration-300 rounded-xl py-3 font-semibold"
        >

          <FaSignOutAlt />

          Logout

        </button>

      </div>

    </aside>
  );
}

export default DermatologistSidebar;