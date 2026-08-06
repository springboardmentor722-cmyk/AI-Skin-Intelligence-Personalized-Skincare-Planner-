import axios from "axios";

const API = "http://localhost:8000";

export const getUserDashboardStats = async () => {

    const token = localStorage.getItem("token");

    const response = await axios.get(
        `${API}/dashboard/user-stats`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return response.data;
};