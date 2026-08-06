import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import {
  getPendingRequests,
  approveRequest,
  rejectRequest,
} from "../services/roleRequestService";

function AdminRoleRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  const fetchRequests = async () => {
    try {
      setLoading(true);

      const data = await getPendingRequests();

      setRequests(data);

    } catch (error) {
      console.error(error);
      alert("Failed to load requests.");
    } finally {
      setLoading(false);
    }
  };

  fetchRequests();
}, []);

 const refreshRequests = async () => {
  try {
    const data = await getPendingRequests();
    setRequests(data);
  } catch (error) {
    console.error(error);
  }
};
  const handleApprove = async (id) => {
  try {
    await approveRequest(id);

    alert("Request Approved.");

    await refreshRequests();

  } catch (error) {
    console.error(error);
    alert("Approval Failed.");
  }
};

const handleReject = async (id) => {
  try {
    await rejectRequest(id);

    alert("Request Rejected.");

    await refreshRequests();

  } catch (error) {
    console.error(error);
    alert("Rejection Failed.");
  }
};

  return (
    <AdminLayout>

      <h1 className="text-3xl font-bold mb-6">
        Role Requests
      </h1>

      {loading ? (
        <div className="text-center py-10">
          Loading...
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded shadow p-6 text-center">
          No Pending Requests.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow">

          <table className="w-full">

            <thead className="bg-blue-600 text-white">

              <tr>
                <th className="p-3">User ID</th>
                <th className="p-3">Requested Role</th>
                <th className="p-3">Qualification</th>
                <th className="p-3">Experience</th>
                <th className="p-3">Certificate</th>
                <th className="p-3">ID Proof</th>
                <th className="p-3">Actions</th>
              </tr>

            </thead>

            <tbody>

              {requests.map((request) => (

                <tr
                  key={request.id}
                  className="border-b text-center"
                >

                  <td className="p-3">
                    {request.user_id}
                  </td>

                  <td className="p-3">
                    {request.requested_role}
                  </td>

                  <td className="p-3">
                    {request.qualification}
                  </td>

                  <td className="p-3">
                    {request.experience}
                  </td>

                  <td className="p-3">

                    <a
                      href={`http://127.0.0.1:8000/${request.certificate}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline"
                    >
                      View
                    </a>

                  </td>

                  <td className="p-3">

                    <a
                      href={`http://127.0.0.1:8000/${request.id_proof}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline"
                    >
                      View
                    </a>

                  </td>

                  <td className="p-3 flex justify-center gap-2">

                    <button
                      onClick={() =>
                        handleApprove(request.id)
                      }
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      Approve
                    </button>

                    <button
                      onClick={() =>
                        handleReject(request.id)
                      }
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Reject
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>
      )}

    </AdminLayout>
  );
}

export default AdminRoleRequests;