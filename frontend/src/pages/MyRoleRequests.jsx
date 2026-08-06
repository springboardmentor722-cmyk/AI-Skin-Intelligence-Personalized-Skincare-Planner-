import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { getMyRequests } from "../services/roleRequestService";

function MyRoleRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const data = await getMyRequests();
        setRequests(data);
      } catch (error) {
        console.error(error);
        alert("Failed to load requests.");
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, []);

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">
        My Role Requests
      </h1>

      {loading ? (

  <div className="text-center py-20 text-xl font-semibold">
    Loading Role Requests...
  </div>

) : requests.length === 0 ? (

  <div className="bg-white rounded-3xl shadow-xl p-16 text-center">

    <div className="text-6xl mb-5">
      📋
    </div>

    <h2 className="text-3xl font-bold text-gray-700">
      No Role Requests Yet
    </h2>

    <p className="text-gray-500 mt-3">
      You haven't applied for any professional role.
    </p>

  </div>

) : (

  <div className="space-y-8">

    {requests.map((request) => (

      <div
        key={request.id}
        className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition duration-300"
      >

        <div className="flex justify-between items-start">

          <div>

            <h2 className="text-2xl font-bold text-gray-800">
              👨‍⚕️ {request.requested_role}
            </h2>

            <p className="text-gray-500 mt-1">
              Submitted for professional verification
            </p>

          </div>

          <span
            className={`px-5 py-2 rounded-full text-white font-semibold ${
              request.status === "Approved"
                ? "bg-green-600"
                : request.status === "Rejected"
                ? "bg-red-600"
                : "bg-yellow-500"
            }`}
          >
            {request.status}
          </span>

        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-8">

          <div className="bg-gray-50 rounded-2xl p-5">

            <p className="text-gray-500 text-sm">
              Qualification
            </p>

            <h3 className="font-bold text-lg mt-1">
              {request.qualification}
            </h3>

          </div>

          <div className="bg-gray-50 rounded-2xl p-5">

            <p className="text-gray-500 text-sm">
              Experience
            </p>

            <h3 className="font-bold text-lg mt-1">
              {request.experience}
            </h3>

          </div>

          <div className="bg-gray-50 rounded-2xl p-5">

            <p className="text-gray-500 text-sm">
              License Number
            </p>

            <h3 className="font-bold text-lg mt-1">
              {request.license_number || "N/A"}
            </h3>

          </div>

        </div>

        {request.admin_message && (

          <div className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-5">

            <h3 className="font-bold text-blue-700 mb-2">
              Admin Remarks
            </h3>

            <p className="text-gray-700">
              {request.admin_message}
            </p>

          </div>

        )}

      </div>

    ))}

  </div>

)}

    </DashboardLayout>
  );
}

export default MyRoleRequests;