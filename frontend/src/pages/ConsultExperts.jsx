import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";

import {
    FaUserMd,
    FaSearch,
    FaHospital,
    FaGraduationCap,
    FaBriefcase
} from "react-icons/fa";

import "../styles/experts.css";

function ConsultExperts() {

    const [experts, setExperts] = useState([]);
    const [search, setSearch] = useState("");
    const [role, setRole] = useState("ALL");
    const [message, setMessage] = useState("");

    useEffect(() => {
        loadExperts();
    }, []);

    const loadExperts = async () => {

        try {

            const response = await api.get("/experts");

            setExperts(response.data);

        }

        catch (err) {

            console.log(err);

        }

    };

    // ==========================
    // SEND REQUEST
    // ==========================

    const sendRequest = async (expertId) => {

        try {

            const response = await api.post(
                "/consultations/request",
                {
                    expert_id: expertId
                }
            );

            setMessage(response.data.message);

        }

        catch (err) {

            if (err.response) {

                setMessage(err.response.data.detail);

            }

            else {

                setMessage("Unable to send request.");

            }

        }

    };

    const filteredExperts = experts.filter((expert) => {

        const matchesSearch =
            expert.name.toLowerCase().includes(search.toLowerCase());

        const matchesRole =
            role === "ALL" || expert.role === role;

        return matchesSearch && matchesRole;

    });

    return (

        <DashboardLayout>

            <div className="experts-header">

                <h2>Consult Skin Experts</h2>

                <p>

                    Choose a verified consultant or dermatologist.

                </p>

            </div>

            {
                message &&

                <div className="alert alert-success">

                    {message}

                </div>
            }

            <div className="row mb-4">

                <div className="col-md-8">

                    <div className="input-group">

                        <span className="input-group-text">

                            <FaSearch />

                        </span>

                        <input

                            className="form-control"

                            placeholder="Search Expert"

                            value={search}

                            onChange={(e) => setSearch(e.target.value)}

                        />

                    </div>

                </div>

                <div className="col-md-4">

                    <select

                        className="form-select"

                        value={role}

                        onChange={(e) => setRole(e.target.value)}

                    >

                        <option value="ALL">

                            All Experts

                        </option>

                        <option value="CONSULTANT">

                            Consultant

                        </option>

                        <option value="DERMATOLOGIST">

                            Dermatologist

                        </option>

                    </select>

                </div>

            </div>

            <div className="row">

                {

                    filteredExperts.map((expert) => (

                        <div
                            className="col-lg-4 mb-4"
                            key={expert.id}
                        >

                            <div className="expert-card">

                                <div className="expert-top">

                                    <FaUserMd className="expert-icon" />

                                    <div>

                                        <h4>

                                            {expert.name}

                                        </h4>

                                        <span
                                            className={
                                                expert.role === "CONSULTANT"
                                                    ? "badge bg-primary"
                                                    : "badge bg-success"
                                            }
                                        >

                                            {expert.role}

                                        </span>

                                    </div>

                                </div>

                                <hr />

                                <p>

                                    <FaGraduationCap />

                                    {" "}

                                    {expert.qualification || "-"}

                                </p>

                                <p>

                                    <FaBriefcase />

                                    {" "}

                                    {expert.experience || 0} Years Experience

                                </p>

                                <p>

                                    <FaHospital />

                                    {" "}

                                    {expert.organization || "-"}

                                </p>

                                <p>

                                    <strong>

                                        Specialization

                                    </strong>

                                    <br />

                                    {expert.specialization || "-"}

                                </p>

                                <button

                                    className="btn btn-success w-100"

                                    onClick={() =>

                                        sendRequest(expert.id)

                                    }

                                >

                                    Send Request

                                </button>

                            </div>

                        </div>

                    ))

                }

            </div>

        </DashboardLayout>

    );

}

export default ConsultExperts;