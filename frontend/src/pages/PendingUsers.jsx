import { useEffect, useState } from "react";
import api from "../services/api";
import DashboardLayout from "../layouts/DashboardLayout";

function PendingUsers() {

    const [users, setUsers] = useState([]);

    useEffect(() => {
        loadPendingUsers();
    }, []);

    const loadPendingUsers = async () => {

        try {

            const response = await api.get("/pending-users");

            setUsers(response.data);

        } catch (error) {

            console.log(error);

        }

    };

    const approveUser = async (id) => {

        await api.put(`/approve/${id}`);

        loadPendingUsers();

    };

    const rejectUser = async (id) => {

        await api.put(`/reject/${id}`);

        loadPendingUsers();

    };

    return (

        <DashboardLayout>

            <div className="container">

                <h2 className="mb-4">

                    Pending Registrations

                </h2>

                <table className="table table-bordered table-hover">

                    <thead className="table-success">

                        <tr>

                            <th>Name</th>

                            <th>Email</th>

                            <th>Role</th>

                            <th>Qualification</th>

                            <th>Experience</th>

                            <th>Status</th>

                            <th>Action</th>

                        </tr>

                    </thead>

                    <tbody>

                        {

                            users.map(user => (

                                <tr key={user.id}>

                                    <td>{user.name}</td>

                                    <td>{user.email}</td>

                                    <td>{user.role}</td>

                                    <td>{user.qualification}</td>

                                    <td>{user.experience} Years</td>

                                    <td>

                                        <span className="badge bg-warning">

                                            {user.verification_status}

                                        </span>

                                    </td>

                                    <td>

                                        <button

                                            className="btn btn-success btn-sm me-2"

                                            onClick={() => approveUser(user.id)}

                                        >

                                            Approve

                                        </button>

                                        <button

                                            className="btn btn-danger btn-sm"

                                            onClick={() => rejectUser(user.id)}

                                        >

                                            Reject

                                        </button>

                                    </td>

                                </tr>

                            ))

                        }

                    </tbody>

                </table>

            </div>

        </DashboardLayout>

    );

}

export default PendingUsers;