import DermatologistSidebar from "../components/sidebar/DermatologistSidebar";

function DermatologistLayout({ children }) {

  return (

    <div className="flex bg-gray-100 min-h-screen">

      <DermatologistSidebar />

      <main className="flex-1 p-8">

        {children}

      </main>

    </div>

  );

}

export default DermatologistLayout;