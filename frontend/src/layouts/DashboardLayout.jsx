import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("sidebar-collapsed") === "true"; } catch { return false; }
  });

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", collapsed);
  }, [collapsed]);

  const sidebarMargin = collapsed ? "80px" : "260px";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-main, #F7FAFC)" }}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onCollapse={() => setCollapsed(c => !c)}
      />

      <motion.div
        style={{
          flex: 1,
          minWidth: 0,
          paddingTop: "72px",
          minHeight: "100vh",
          background: "var(--bg-main, #F7FAFC)",
        }}
        className="dashboard-content"
        animate={{ marginLeft: typeof window !== "undefined" && window.innerWidth >= 1024 ? sidebarMargin : 0 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      >
        <Navbar onMenuToggle={() => setSidebarOpen(true)} />
        <main className="p-6 md:p-8 max-w-[1600px] mx-auto min-h-[calc(100vh-72px)]">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </motion.div>
    </div>
  );
}
