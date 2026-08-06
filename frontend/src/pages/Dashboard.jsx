import AdminDashboard from "../dashboards/AdminDashboard";
import UserDashboard from "../dashboards/UserDashboard";


function Dashboard() {

  const role = localStorage.getItem("role");

  if (role === "admin") {
    return <AdminDashboard />;
  }

  return <UserDashboard />;
}

export default Dashboard;