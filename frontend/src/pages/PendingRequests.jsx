import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";

function PendingRequests() {

    const navigate = useNavigate();

    const [requests, setRequests] = useState([]);
    const [message, setMessage] = useState("");
    const role = localStorage.getItem("role");

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {

        try {

            const response = await api.get("/consultations/pending");

            setRequests(response.data);

        }

        catch (err) {

            console.log(err);

        }

    };

    const acceptRequest = async (id) => {

        try {

            await api.put(`/consultations/accept/${id}`);

            setMessage("Consultation request accepted.");

            loadRequests();

        }

        catch (err) {

            console.log(err);

        }

    };

    const rejectRequest = async (id) => {

        try {

            await api.put(`/consultations/reject/${id}`);

            setMessage("Consultation request rejected.");

            loadRequests();

        }

        catch (err) {

            console.log(err);

        }

    };

    return (

        <DashboardLayout>

            <div className="d-flex justify-content-between align-items-center mb-4">

                <h2>

                    Consultation Requests

                </h2>

            </div>

            {

                message &&

                <div className="alert alert-success">

                    {message}

                </div>

            }

            <table className="table table-striped table-bordered shadow">

                <thead className="table-dark">

                    <tr>

                        <th>Request ID</th>

                        <th>User ID</th>

                        <th>User</th>

                        <th>Status</th>

                        <th width="320">

                            Actions

                        </th>

                    </tr>

                </thead>

                <tbody>

                    {

                        requests.length === 0 ?

                        (

                            <tr>

                                <td
                                    colSpan="5"
                                    className="text-center"
                                >

                                    No pending consultation requests.

                                </td>

                            </tr>

                        )

                        :

                        (

                            requests.map((request)=>(

                                <tr key={request.id}>

                                    <td>

                                        {request.id}

                                    </td>

                                    <td>

                                        {request.user_id}

                                    </td>

                                    <td>

                                        <strong>{request.user?.name || "Unknown"}</strong>

                                    </td>

                                    <td>

                                        <span className="badge bg-warning text-dark">

                                            {request.status}

                                        </span>

                                    </td>

                                    <td>

                                        {role === "DERMATOLOGIST" && <button

                                            className="btn btn-primary btn-sm me-2"

                                            onClick={()=>

                                                navigate(`/case/${request.id}`)

                                            }

                                        >

                                            Open Case

                                        </button>}
                                        {role === "CONSULTANT" && <button className="btn btn-primary btn-sm me-2" onClick={() => navigate(`/consultant/case/${request.id}`)}>Open Case</button>}

                                        <button

                                            className="btn btn-success btn-sm me-2"

                                            onClick={()=>

                                                acceptRequest(request.id)

                                            }

                                        >

                                            Accept

                                        </button>

                                        <button

                                            className="btn btn-danger btn-sm"

                                            onClick={()=>

                                                rejectRequest(request.id)

                                            }

                                        >

                                            Reject

                                        </button>

                                    </td>

                                </tr>

                            ))

                        )

                    }

                </tbody>

            </table>

        </DashboardLayout>

    );

}

export default PendingRequests;
