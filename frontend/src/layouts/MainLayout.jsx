import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";

function MainLayout({ children }) {

    return (

        <div className="d-flex flex-column min-vh-100">

            <Navbar />

            <div className="d-flex flex-grow-1">

                <Sidebar />

                <div
                    className="container-fluid p-4"
                    style={{ background: "#f8f9fa" }}
                >

                    {children}

                </div>

            </div>

            <Footer />

        </div>

    );

}

export default MainLayout;