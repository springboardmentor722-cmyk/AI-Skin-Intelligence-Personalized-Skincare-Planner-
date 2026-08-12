import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";

function ManageUsers() {

    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const response = await api.get("/users");
            setUsers(response.data);
        } catch (error) {
            console.log(error);
        }
    };

const deleteUser = async (id) => {

    if (!window.confirm("Are you sure you want to delete this user?")) {
        return;
    }

    try {

        await api.delete(`/users/${id}`);

        alert("User deleted successfully.");

        await loadUsers();

    } catch (error) {

        console.error("Delete user error:", error);

        const detail =
            error.response?.data?.detail ||
            "Unable to delete user.";

        alert(detail);
    }
};

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
    );

    return (

        <DashboardLayout>

            <div className="container">

                <h2 className="mb-4">

                    Manage Users

                </h2>

                <input
                    className="form-control mb-4"
                    placeholder="Search user..."
                    value={search}
                    onChange={(e)=>setSearch(e.target.value)}
                />

                <table className="table table-hover shadow">

                    <thead className="table-success">

                        <tr>

                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Action</th>

                        </tr>

                    </thead>

                    <tbody>

                        {

                            filteredUsers.map(user=>(

                                <tr key={user.id}>

                                    <td>{user.name}</td>

                                    <td>{user.email}</td>

                                    <td>{user.role}</td>

                                    <td>

                                        <span
                                            className={
                                                user.verification_status==="Approved"
                                                ?
                                                "badge bg-success"
                                                :
                                                user.verification_status==="Pending"
                                                ?
                                                "badge bg-warning text-dark"
                                                :
                                                "badge bg-danger"
                                            }
                                        >
                                            {user.verification_status}
                                        </span>

                                    </td>

                                    <td>

                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={()=>deleteUser(user.id)}
                                        >
                                            Delete
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

export default ManageUsers;