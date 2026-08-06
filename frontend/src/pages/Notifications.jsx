import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import ConsultantLayout from "../layouts/ConsultantLayout";
import DermatologistLayout from "../layouts/DermatologistLayout";
import {
  getNotifications,
  markNotificationRead,
} from "../services/notificationService";
import {
  FaBell,
  FaCalendarCheck,
  FaUserMd,
  FaCheckCircle,
} from "react-icons/fa";

function Notifications() {

    

  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);

  const role = localStorage.getItem("role");

let Layout;

if (role === "consultant") {

  Layout = ConsultantLayout;

} else if (role === "dermatologist") {

  Layout = DermatologistLayout;

} else {

  Layout = DashboardLayout;

}

  useEffect(() => {

    getNotifications()
      .then((data) => {
        setNotifications(data);
      })
      .catch((error) => {
        console.error(error);
        alert("Failed to load notifications.");
      })
      .finally(() => {
        setLoading(false);
      });

  }, []);

  const handleRead = async (id) => {

    await markNotificationRead(id);

    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, is_read: true }
          : item
      )
    );

  };
  const getIcon = (title) => {

  if (!title) {
    return <FaBell className="text-blue-600 text-2xl" />;
  }

  if (title.toLowerCase().includes("appointment")) {
    return <FaCalendarCheck className="text-green-600 text-2xl" />;
  }

  if (title.toLowerCase().includes("consultant")) {
    return <FaUserMd className="text-orange-600 text-2xl" />;
  }

  return <FaBell className="text-blue-600 text-2xl" />;

};
  

  return (

   <Layout>

      <h1 className="text-3xl font-bold mb-8">
        Notifications
      </h1>

      {loading ? (

        <div>Loading...</div>

      ) : notifications.length === 0 ? (

        <div>No Notifications</div>

      ) : (

        <div className="space-y-4">

          {notifications.map((item) => (

            <div
  key={item.id}
  className={`rounded-xl shadow-lg p-6 border-l-4 ${
    item.is_read
      ? "bg-gray-100 border-gray-400"
      : "bg-blue-50 border-blue-600"
  }`}
>

  <div className="flex justify-between">

    <div className="flex gap-4">

      {getIcon(item.title)}

      <div>

        <h2 className="font-bold text-lg">
          {item.title}
        </h2>

        <p className="mt-2 text-gray-700">
          {item.message}
        </p>

        <p className="text-sm text-gray-500 mt-3">
          {new Date(item.created_at).toLocaleString()}
        </p>

      </div>

    </div>

    <div>

      {item.is_read ? (

        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">

          <FaCheckCircle />

          Read

        </span>

      ) : (

        <button
          onClick={() => handleRead(item.id)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Mark as Read
        </button>

      )}

    </div>

  </div>

</div>



          ))}



        </div>

      )}

    </Layout>

  );

}

export default Notifications;