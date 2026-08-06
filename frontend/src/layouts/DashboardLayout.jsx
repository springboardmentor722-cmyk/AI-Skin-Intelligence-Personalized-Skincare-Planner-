import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";

function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#F6FFF8] via-[#F9FCFB] to-[#EEF8F3]">

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Navbar */}
        <Navbar />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">

          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>

        </main>

      </div>

    </div>
  );
}

export default DashboardLayout;