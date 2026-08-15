import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

/**
 * Layout for every public-facing route (landing, login, register).
 * Authenticated dashboard routes use DashboardLayout instead, since
 * they need a sidebar rather than the marketing navbar/footer.
 */
export default function PublicLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}
