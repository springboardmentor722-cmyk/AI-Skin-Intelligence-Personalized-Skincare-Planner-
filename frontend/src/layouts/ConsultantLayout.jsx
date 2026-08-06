import ConsultantSidebar from "../components/sidebar/ConsultantSidebar";

function ConsultantLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-100">

      <ConsultantSidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>

    </div>
  );
}

export default ConsultantLayout;