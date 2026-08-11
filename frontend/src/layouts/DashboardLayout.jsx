import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import "../styles/dashboard.css";

function DashboardLayout({ children }) {
    return (
        <div className="dashboard">

            {/* Sidebar */}
            <aside className="dashboard-sidebar">
                <Sidebar />
            </aside>

            {/* Right Section */}
            <div className="dashboard-right">

                {/* Top Navbar */}
                <Navbar />

                {/* Main Content */}
                <main className="dashboard-content">
                    {children}
                </main>

                {/* Footer */}
                <Footer />

            </div>

        </div>
    );
}

export default DashboardLayout;