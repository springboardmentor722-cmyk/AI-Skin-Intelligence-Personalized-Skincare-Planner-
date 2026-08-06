import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaUserCircle,
  FaLeaf,
  FaHeartbeat,
  FaBoxOpen,
  FaFlask,
  FaChartLine,
  FaUsersCog,
  FaBell,
} from "react-icons/fa";

import logo from "../../assets/logo/logo.png";

function Sidebar() {
  const role = localStorage.getItem("role");
  const location = useLocation();

  const menuClass = (path) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
      location.pathname === path
        ? "bg-green-600 text-white shadow-lg"
        : "text-green-100 hover:bg-green-700/40 hover:text-white"
    }`;

  return (
    <aside className="w-72 bg-gradient-to-b from-[#14532D] via-[#166534] to-[#14532D] text-white min-h-screen flex flex-col shadow-2xl">

      {/* Logo */}
      <div className="px-6 py-8 border-b border-green-700">

        <div className="flex items-center gap-3">

          <img
            src={logo}
            alt="Logo"
            className="w-12 h-12 rounded-xl bg-white p-1"
          />

          <div>

            <h2 className="text-2xl font-bold">
              AI Skin
            </h2>

            <p className="text-sm text-green-200">
              Intelligence
            </p>

          </div>

        </div>

      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">

        {role === "user" && (
  <>

        <Link to="/dashboard" className={menuClass("/dashboard")}>
          <FaHome />
          Dashboard
        </Link>

        <Link to="/profile" className={menuClass("/profile")}>
          <FaUserCircle />
          Profile
        </Link>

        <Link to="/skin-profile" className={menuClass("/skin-profile")}>
          <FaLeaf />
          Skin Profile
        </Link>

        <Link to="/lifestyle" className={menuClass("/lifestyle")}>
          <FaHeartbeat />
          Lifestyle
        </Link>

        <Link to="/products" className={menuClass("/products")}>
          <FaBoxOpen />
          Products
        </Link>

        <Link to="/ingredients" className={menuClass("/ingredients")}>
          <FaFlask />
          Ingredients
        </Link>

        <Link to="/progress" className={menuClass("/progress")}>
          <FaChartLine />
          Progress
        </Link>

        <Link
          to="/skin-assessment"
          className={menuClass("/skin-assessment")}
        >
          📷 AI Skin Assessment
        </Link>

        <Link
          to="/assessment-history"
          className={menuClass("/assessment-history")}
        >
          📑 Assessment History
        </Link>

        <Link
  to="/recommendations"
  className={menuClass("/recommendations")}
>
  🤖 Recommendations
</Link>

<Link
  to="/routine"
  className={menuClass("/routine")}
>
  🌞 AI Routine
</Link>

        <Link
          to="/book-appointment"
          className={menuClass("/book-appointment")}
        >
          📅 Book Appointment
        </Link>

        <Link
          to="/appointments"
          className={menuClass("/appointments")}
        >
          📋 My Appointments
        </Link>

        <Link
          to="/notifications"
          className={menuClass("/notifications")}
        >
          <FaBell />
          Notifications
        </Link>

        <Link
          to="/treatment-plan"
          className={menuClass("/treatment-plan")}
        >
          💊 Treatment Plan
        </Link>

        

        {role === "user" && (
          <>
            <div className="pt-5 pb-2 text-xs uppercase tracking-widest text-green-300">
              Role
            </div>

            <Link
              to="/apply-role"
              className={menuClass("/apply-role")}
            >
              Apply for Role
            </Link>

            <Link
              to="/my-role-requests"
              className={menuClass("/my-role-requests")}
            >
              My Role Requests
            </Link>
          </>
        )}
          </>
)}

        {role === "admin" && (
  <>
    <div className="pt-5 pb-2 text-xs uppercase tracking-widest text-green-300">
      Administration
    </div>

    <Link
      to="/admin/dashboard"
      className={menuClass("/admin/dashboard")}
    >
      <FaHome />
      Dashboard
    </Link>

    <Link
      to="/admin/users"
      className={menuClass("/admin/users")}
    >
      <FaUsersCog />
      User Management
    </Link>

    <Link
      to="/admin/role-requests"
      className={menuClass("/admin/role-requests")}
    >
      <FaUserCircle />
      Role Requests
    </Link>

    <Link
      to="/admin/products"
      className={menuClass("/admin/products")}
    >
      <FaBoxOpen />
      Product Management
    </Link>

    <Link
      to="/admin/ingredients"
      className={menuClass("/admin/ingredients")}
    >
      <FaFlask />
      Ingredient Management
    </Link>

    <Link
      to="/admin/progress"
      className={menuClass("/admin/progress")}
    >
      <FaChartLine />
      Progress Records
    </Link>

    <Link
      to="/admin/notifications"
      className={menuClass("/admin/notifications")}
    >
      <FaBell />
      Notifications
    </Link>

    <Link
      to="/profile"
      className={menuClass("/profile")}
    >
      <FaUserCircle />
      Admin Profile
    </Link>
  </>
)}
      </nav>

      {/* Footer */}
      <div className="border-t border-green-700 p-5">

        <div className="bg-green-700/40 rounded-xl p-4 text-center">

          <p className="text-sm text-green-200">
            AI Skin Intelligence
          </p>

          <p className="font-semibold">
            Version 1.0
          </p>

        </div>

      </div>

    </aside>
  );
}

export default Sidebar;