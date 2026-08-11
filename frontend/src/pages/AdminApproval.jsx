import { useEffect, useState } from "react";
import api from "../services/api";

function AdminApproval() {

    const [users, setUsers] = useState([]);

    const loadUsers = async () => {

        try {

            const response = await api.get("/pending-users");

            setUsers(response.data);

        } catch (error) {

            console.log(error);

        }

    };

    useEffect(() => {

        loadUsers();

    }, []);

    const approveUser = async (id) => {

        try {

            await api.put(`/approve/${id}`);

            alert("User Approved Successfully");

            loadUsers();

        } catch (error) {

            console.log(error);

        }

    };

    const rejectUser = async (id) => {

        try {

            await api.put(`/reject/${id}`);

            alert("User Rejected Successfully");

            loadUsers();

        } catch (error) {

            console.log(error);

        }

    };

    return (

        <div className="container mt-5">

            <h2 className="mb-4">
                Pending Account Approvals
            </h2>

            <table className="table table-bordered table-hover">

                <thead className="table-dark">

                    <tr>

                        <th>Name</th>

                        <th>Email</th>

                        <th>Role</th>

                        <th>Qualification</th>

                        <th>Experience</th>

                        <th>Specialization</th>

                        <th>Organization</th>

                        <th>License</th>

                        <th>Status</th>

                        <th>Action</th>

                    </tr>

                </thead>

                <tbody>

                    {users.length === 0 ? (

                        <tr>

                            <td colSpan="10" className="text-center">

                                No Pending Users

                            </td>

                        </tr>

                    ) : (

                        users.map((user) => (

                            <tr key={user.id}>

                                <td>{user.name}</td>

                                <td>{user.email}</td>

                                <td>{user.role}</td>

                                <td>{user.qualification}</td>

                                <td>{user.experience}</td>

                                <td>{user.specialization}</td>

                                <td>{user.organization}</td>

                                <td>{user.license_number}</td>

                                <td>{user.verification_status}</td>

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

                    )}

                </tbody>

            </table>

        </div>

    );

}

export default AdminApproval;