import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

function MyConsultation() {

    const [consultation, setConsultation] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadConsultation();
    }, []);

    const loadConsultation = async () => {

        try {

            const response = await api.get("/consultations/my-consultation");

            setConsultation(response.data);

        }

        catch (err) {

            console.log(err);

        }

    };

    if (!consultation) {

        return (

            <DashboardLayout>

                <h3>Loading...</h3>

            </DashboardLayout>

        );

    }

    if (consultation.message) {

        return (

            <DashboardLayout>

                <div className="card shadow p-5 text-center">

                    <h2>My Consultation</h2>

                    <hr/>

                    <h5>{consultation.message}</h5>

                    <p className="text-muted">

                        Send a consultation request to a consultant or dermatologist to receive personalized skincare recommendations.

                    </p>

                </div>

            </DashboardLayout>

        );

    }

    return (

        <DashboardLayout>

            <div className="card shadow">

                <div className="card-body">

                    <h2 className="mb-4">

                        My Consultation

                    </h2>

                    <hr/>

                    <div className="mb-3">

                        <strong>Status</strong>

                        <br/>

                        <span
                            className={
                                consultation.status === "Completed"
                                    ? "badge bg-success"
                                    : consultation.status === "Accepted"
                                    ? "badge bg-primary"
                                    : "badge bg-warning text-dark"
                            }
                        >
                            {consultation.status}
                        </span>

                    </div>

                    <div className="mb-3">

                        <strong>Expert Name</strong>

                        <p>

                            {consultation.expert_name}

                        </p>

                    </div>

                    <div className="mb-3">

                        <strong>Expert Role</strong>

                        <p>

                            {consultation.expert_role}

                        </p>

                    </div>

                    <hr/>

                    <h4>

                        Recommendation

                    </h4>

                    {

                        consultation.recommendation ?

                        (

                            <div
                                className="alert alert-success mt-3"
                                style={{
                                    whiteSpace: "pre-line"
                                }}
                            >

                                {consultation.recommendation}

                            </div>

                        )

                        :

                        (

                            <div className="alert alert-warning mt-3">

                                Your expert has not submitted a recommendation yet.

                            </div>

                        )

                    }

                    {consultation.progress_observations && <><h4 className="mt-4">Progress Observations</h4><p style={{ whiteSpace: "pre-line" }}>{consultation.progress_observations}</p></>}
                    {consultation.routine_suggestions && <><h4>Routine Suggestions</h4><p style={{ whiteSpace: "pre-line" }}>{consultation.routine_suggestions}</p></>}
                    {consultation.follow_up_suggestion && <><h4>Follow-up</h4><p style={{ whiteSpace: "pre-line" }}>{consultation.follow_up_suggestion}</p></>}
                    {consultation.requires_dermatologist && <div className="alert alert-info mt-4"><strong>Your consultant recommends a dermatologist review.</strong><br/><button className="btn btn-primary mt-2" onClick={() => navigate("/consult-experts")}>Approach Dermatologist</button></div>}

                </div>

            </div>

        </DashboardLayout>

    );

}

export default MyConsultation;
