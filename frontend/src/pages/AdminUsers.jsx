import { useEffect, useState } from "react";

import AdminLayout from "../layouts/AdminLayout";

import {
  getAllUsers,
  updateUserRole,
  deleteUser,
} from "../services/adminService";

import {
  FaUsers,
  FaUserShield,
  FaUserMd,
  FaUser,
  FaSearch,
  FaSave,
  FaTrash,
} from "react-icons/fa";

function AdminUsers() {
  const [users, setUsers] = useState([]);

const [loading, setLoading] = useState(false);

const [search, setSearch] = useState("");

const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);

        const data = await getAllUsers();

        setUsers(data);

      } catch (error) {
        console.error(error);
        alert("Failed to load users.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {

  const matchesSearch =
    user.full_name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase());

  const matchesRole =
    roleFilter === "all" ||
    user.role === roleFilter;

  return matchesSearch && matchesRole;

});

const totalUsers = users.length;

const totalAdmins = users.filter(
  (u) => u.role === "admin"
).length;

const totalDermatologists = users.filter(
  (u) => u.role === "dermatologist"
).length;

const totalConsultants = users.filter(
  (u) => u.role === "consultant"
).length;

const totalNormalUsers = users.filter(
  (u) => u.role === "user"
).length;

  

  const handleRoleChange = (id, role) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === id ? { ...user, role } : user
      )
    );
  };

  const saveRole = async (id, role) => {
    try {
      await updateUserRole(id, role);

      alert("Role updated successfully.");

      setUsers((prev) =>
        prev.map((user) =>
          user.id === id ? { ...user, role } : user
        )
      );

    } catch (error) {
      console.error(error);
      alert("Failed to update role.");
    }
  };

  const removeUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;

    try {
      await deleteUser(id);

      alert("User deleted.");

      setUsers((prev) =>
        prev.filter((user) => user.id !== id)
      );

    } catch (error) {
  console.error(error);

  if (error.response) {
    alert(error.response.data.detail);
  } else {
    alert("Failed to delete user.");
  }
}
  };

  return (
    <AdminLayout>
     <div className="mb-8">

  {/* Header */}

<div className="mb-8">

  <h1 className="text-4xl font-bold text-gray-800">
    User Management
  </h1>

  <p className="text-gray-500 mt-2">
    Manage platform users, update roles, and monitor system access.
  </p>

</div>

{/* Statistics */}

<div className="grid grid-cols-2 lg:grid-cols-5 gap-5 mb-8">

  <div className="bg-white rounded-2xl shadow-lg p-5 border-l-4 border-green-600">

    <div className="flex items-center justify-between">

      <div>

        <p className="text-gray-500 text-sm">
          Total Users
        </p>

        <h2 className="text-3xl font-bold">
          {totalUsers}
        </h2>

      </div>

      <FaUsers className="text-4xl text-green-600" />

    </div>

  </div>

  <div className="bg-white rounded-2xl shadow-lg p-5 border-l-4 border-blue-600">

    <div className="flex items-center justify-between">

      <div>

        <p className="text-gray-500 text-sm">
          Users
        </p>

        <h2 className="text-3xl font-bold">
          {totalNormalUsers}
        </h2>

      </div>

      <FaUser className="text-4xl text-blue-600" />

    </div>

  </div>

  <div className="bg-white rounded-2xl shadow-lg p-5 border-l-4 border-orange-500">

    <div className="flex items-center justify-between">

      <div>

        <p className="text-gray-500 text-sm">
          Consultants
        </p>

        <h2 className="text-3xl font-bold">
          {totalConsultants}
        </h2>

      </div>

      <FaUserShield className="text-4xl text-orange-500" />

    </div>

  </div>

  <div className="bg-white rounded-2xl shadow-lg p-5 border-l-4 border-purple-600">

    <div className="flex items-center justify-between">

      <div>

        <p className="text-gray-500 text-sm">
          Dermatologists
        </p>

        <h2 className="text-3xl font-bold">
          {totalDermatologists}
        </h2>

      </div>

      <FaUserMd className="text-4xl text-purple-600" />

    </div>

  </div>

  <div className="bg-white rounded-2xl shadow-lg p-5 border-l-4 border-red-600">

    <div className="flex items-center justify-between">

      <div>

        <p className="text-gray-500 text-sm">
          Admins
        </p>

        <h2 className="text-3xl font-bold">
          {totalAdmins}
        </h2>

      </div>

      <FaUserShield className="text-4xl text-red-600" />

    </div>

  </div>

</div>

{/* Search & Filter */}

<div className="bg-white rounded-2xl shadow-lg p-5 mb-8 flex flex-col md:flex-row gap-4">

  <div className="relative flex-1">

    <FaSearch className="absolute left-4 top-4 text-gray-400" />

    <input
      type="text"
      placeholder="Search by name or email..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-600 outline-none"
    />

  </div>

  <select
    value={roleFilter}
    onChange={(e) => setRoleFilter(e.target.value)}
    className="border rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-600"
  >

    <option value="all">All Roles</option>
    <option value="user">User</option>
    <option value="consultant">Consultant</option>
    <option value="dermatologist">Dermatologist</option>
    <option value="admin">Admin</option>

  </select>

</div>
</div>

      {loading ? (
        <div className="text-center text-xl font-semibold py-20">
          Loading Users...
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">

  <div className="px-6 py-5 border-b bg-gray-50">

    <h2 className="text-2xl font-bold text-gray-800">
      Registered Users
    </h2>

    <p className="text-gray-500 text-sm mt-1">
      Manage user roles and account access.
    </p>

  </div>

  <div className="overflow-x-auto">
          <table className="w-full">

            <thead className="bg-gradient-to-r from-green-600 to-emerald-700 text-white">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Name</th>
                <th className="px-6 py-4 text-left font-semibold">Email</th>
                <th className="px-6 py-4 text-left font-semibold">Age</th>
                <th className="px-6 py-4 text-left font-semibold">Gender</th>
                <th className="px-6 py-4 text-left font-semibold">Role</th>
                <th className="px-6 py-4 text-left font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody>

             {filteredUsers.length > 0 ? (
  filteredUsers.map((user) => (
                  <tr
key={user.id}
className="border-b hover:bg-green-50 transition"
>
                    <td className="px-6 py-4">

<div className="flex items-center gap-3">

<div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">

<FaUser className="text-green-600"/>

</div>

<div>

<h3 className="font-semibold text-gray-800">
{user.full_name}
</h3>

<p className="text-xs text-gray-500">
ID #{user.id}
</p>

</div>

</div>

</td>
                   <td className="px-6 py-4 text-gray-600">
{user.email}
</td>
                    <td className="px-6 py-4">

<span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">

{user.age}

</span>

</td>
                   <td className="px-6 py-4">

<span className="bg-gray-100 px-3 py-1 rounded-full">

{user.gender}

</span>

</td>

                    <td className="p-3">
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(
                            user.id,
                            e.target.value
                          )
                        }
                        className="border rounded-xl px-3 py-2 bg-white shadow-sm focus:ring-2 focus:ring-green-500"
                      >
                        <option value="user">User</option>
                        <option value="consultant">
                          Consultant
                        </option>
                        <option value="dermatologist">
                          Dermatologist
                        </option>
                        <option value="admin">
                          Admin
                        </option>
                      </select>
                    </td>

                    <td className="p-3 flex justify-center gap-2">

                      <button
                        onClick={() =>
                          saveRole(user.id, user.role)
                        }
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition"
                      >
                        <FaSave />
                      </button>

                      <button
                        onClick={() =>
                          removeUser(user.id)
                        }
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition"
                      >
                        <FaTrash />
                      </button>

                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center py-10 text-gray-500"
                  >
                    No Users Found
                  </td>
                </tr>
              )}

            </tbody>

          </table>
        </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminUsers;