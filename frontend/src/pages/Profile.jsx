import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";

import {
    FaUserCircle,
    FaEnvelope,
    FaUserTag,
    FaGraduationCap,
    FaBriefcase,
    FaHospital,
    FaIdCard,
    FaCheckCircle,
    FaClock
} from "react-icons/fa";

import "../styles/profile.css";

function Profile() {

    const [user, setUser] = useState({});
    const role = localStorage.getItem("role");

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {

        try {

            const response = await api.get("/me");

            setUser(response.data);

        }

        catch (err) {

            console.log(err);

        }

    };

    return (

        <DashboardLayout>

            <div className="profile-banner">

                <FaUserCircle className="profile-avatar"/>

                <h2>{user.name}</h2>

                <p>

{

role==="USER"

?

"Registered User"

:

role==="CONSULTANT"

?

"Verified Skincare Consultant"

:

role==="DERMATOLOGIST"

?

"Licensed Dermatologist"

:

"Administrator"

}

</p>

              {(role === "CONSULTANT" || role === "DERMATOLOGIST") && (

user.verification_status === "Approved"

?

<span className="badge bg-success">

<FaCheckCircle className="me-1"/>

Approved

</span>

:

<span className="badge bg-warning text-dark">

<FaClock className="me-1"/>

Pending Verification

</span>

)}
            </div>

            <div className="row mt-4">

                <div className="col-md-6">

                    <div className="profile-card">

                        <h4>Personal Information</h4>

                        <Info icon={<FaEnvelope/>} label="Email" value={user.email}/>

                        <Info icon={<FaUserTag/>} label="Role" value={user.role}/>

                    </div>

                </div>

                {role !== "USER" && (

<div className="col-md-6">

    <div className="profile-card">

        <h4>

            Professional Details

        </h4>

        <Info
            icon={<FaGraduationCap/>}
            label="Qualification"
            value={user.qualification}
        />

        <Info
            icon={<FaBriefcase/>}
            label="Experience"
            value={user.experience ? user.experience + " Years" : "--"}
        />

        <Info
            icon={<FaHospital/>}
            label="Organization"
            value={user.organization}
        />

        <Info
            icon={<FaIdCard/>}
            label="Specialization"
            value={user.specialization}
        />

        {

        role==="DERMATOLOGIST" &&

        <Info
            icon={<FaIdCard/>}
            label="Medical License"
            value={user.license_number}
        />

        }

    </div>

</div>

)}

            </div>

        </DashboardLayout>

    );

}

function Info({icon,label,value}){

    return(

        <div className="info-row">

            <div className="info-icon">

                {icon}

            </div>

            <div>

                <small>{label}</small>

                <h6>{value || "--"}</h6>

            </div>

        </div>

    );

}

export default Profile;