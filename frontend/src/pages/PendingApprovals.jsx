import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";

function PendingApprovals() {

    const [users, setUsers] = useState([]);

    useEffect(() => {
        loadPending();
    }, []);

    const loadPending = async () => {

        const response = await api.get("/pending-users");

        setUsers(response.data);

    };

    const approve = async (id) => {

        await api.put(`/approve/${id}`);

        loadPending();

    };

    const reject = async (id) => {

        await api.put(`/reject/${id}`);

        loadPending();

    };

    return (

        <DashboardLayout>

            <h2 className="mb-4">

                Pending Professional Verifications

            </h2>

            <div className="row">

                {users.map(user => (

                    <div
                        className="col-lg-4 mb-4"
                        key={user.id}
                    >

                        <div className="card shadow h-100 border-0">

                            <div className="card-body">

                                <div className="text-center">

                                    <i
                                        className="bi bi-person-circle text-success"
                                        style={{fontSize:"70px"}}
                                    ></i>

                                    <h4 className="mt-3">

                                        {user.name}

                                    </h4>

                                    <span className="badge bg-warning text-dark">

                                        {user.role}

                                    </span>

                                </div>

                                <hr/>

                                <p>

                                    <strong>Email</strong>

                                    <br/>

                                    {user.email}

                                </p>

                                <p>

                                    <strong>Qualification</strong>

                                    <br/>

                                    {user.qualification}

                                </p>

                                <p>

                                    <strong>Experience</strong>

                                    <br/>

                                    {user.experience} Years

                                </p>

                                <p>

                                    <strong>Organization</strong>

                                    <br/>

                                    {user.organization}

                                </p>

                                <p>

                                    <strong>License</strong>

                                    <br/>

                                    {user.license_number}

                                </p>

                                <div className="d-grid gap-2">

                                    <button
                                        className="btn btn-success"
                                        onClick={()=>approve(user.id)}
                                    >

                                        Approve

                                    </button>

                                    <button
                                        className="btn btn-danger"
                                        onClick={()=>reject(user.id)}
                                    >

                                        Reject

                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>

                ))}

            </div>

        </DashboardLayout>

    );

}

export default PendingApprovals;