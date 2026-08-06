import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo/logo.png";

import {
  FaTachometerAlt,
  FaUsers,
  FaUserShield,
  FaBoxOpen,
  FaFlask,
  FaSignOutAlt,
} from "react-icons/fa";

function AdminLayout({ children }) {

  const location = useLocation();

  const navigate = useNavigate();

  const handleLogout = () => {

    localStorage.clear();

    navigate("/login");

  };

  const menuItems = [

    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: <FaTachometerAlt />,
    },

    {
      name: "User Management",
      path: "/admin/users",
      icon: <FaUsers />,
    },

    {
      name: "Role Requests",
      path: "/admin/role-requests",
      icon: <FaUserShield />,
    },

    

    {
      name: "Products",
      path: "/admin/products",
      icon: <FaBoxOpen />,
    },

    {
      name: "Ingredients",
      path: "/admin/ingredients",
      icon: <FaFlask />,
    },

    

    

  ];

  return (

    <div className="flex min-h-screen bg-gray-100">

      {/* Sidebar */}

      <aside className="w-72 bg-gradient-to-b from-[#14532D] via-[#166534] to-[#14532D] text-white flex flex-col shadow-2xl">

        <div className="p-6 border-b border-green-700">

  <div className="flex items-center gap-3">

    <img
      src={logo}
      alt="Logo"
      className="w-12 h-12 rounded-xl bg-white p-1"
    />

    <div>

      <h2 className="text-2xl font-bold">
        Admin Panel
      </h2>

      <p className="text-sm text-green-200">
        AI Skin Intelligence
      </p>

    </div>

  </div>

</div>

       <nav className="flex-1 p-5 space-y-3">

          {menuItems.map((item) => (

            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
  location.pathname === item.path
    ? "bg-green-600 text-white shadow-lg"
    : "text-green-100 hover:bg-green-700/40 hover:text-white"
}`}
            >

              {item.icon}

              {item.name}

            </Link>

          ))}

        </nav>

        <div className="p-5 border-t border-green-700">

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-red-600 hover:bg-red-700 transition-all font-semibold"
          >

            <FaSignOutAlt />

            Logout

          </button>

        </div>

      </aside>

      {/* Main Content */}

      <main className="flex-1 p-8 overflow-y-auto">

        {children}

      </main>

    </div>

  );

}

export default AdminLayout;