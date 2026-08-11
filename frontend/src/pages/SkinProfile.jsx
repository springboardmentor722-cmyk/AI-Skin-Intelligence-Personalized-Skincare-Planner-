import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";

function SkinProfile() {

    const [form, setForm] = useState({
        age: "",
        gender: "",
        skin_type: "",
        skin_concerns: "",
        allergies: "",
        sensitivities: ""
    });

    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState("");

    const [message, setMessage] = useState("");

    const [skinScore, setSkinScore] = useState(null);
    const [analysis, setAnalysis] = useState({});
    const [aiType, setAiType] = useState("");

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {

        try {

            const response = await api.get("/skin-profile/");

            if (response.data.profile_id) {

                setForm({
                    age: response.data.age,
                    gender: response.data.gender,
                    skin_type: response.data.skin_type,
                    skin_concerns: response.data.skin_concerns,
                    allergies: response.data.allergies,
                    sensitivities: response.data.sensitivities
                });

                setSkinScore(response.data.skin_score);
                setAiType(response.data.ai_skin_type);
                setAnalysis(response.data);

                if (response.data.skin_image) {
                    setPreview("http://127.0.0.1:8000/" + response.data.skin_image);
                }

            }

        } catch (err) {

            console.log(err);

        }

    };

    const handleChange = (e) => {

        setForm({
            ...form,
            [e.target.name]: e.target.value
        });

    };

    const handleImage = (e) => {

        const file = e.target.files[0];

        if (file) {

            setImage(file);
            setPreview(URL.createObjectURL(file));

        }

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        const formData = new FormData();

        formData.append("age", form.age);
        formData.append("gender", form.gender);
        formData.append("skin_type", form.skin_type);
        formData.append("skin_concerns", form.skin_concerns);
        formData.append("allergies", form.allergies);
        formData.append("sensitivities", form.sensitivities);

        if (image) {
            formData.append("skin_image", image);
        }

        try {

            let response;

            try {

                response = await api.put(
                    "/skin-profile/",
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data"
                        }
                    }
                );

                setMessage("Profile Updated Successfully");

            } catch {

                response = await api.post(
                    "/skin-profile/",
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data"
                        }
                    }
                );

                setMessage("Profile Created Successfully");

            }

            setSkinScore(response.data.profile.skin_score);
            setAiType(response.data.profile.ai_skin_type);
            setAnalysis(response.data.profile);

        } catch (err) {

            console.log(err);

        }

    };

    return (

        <DashboardLayout>

            <div className="container py-4">

                <div className="card shadow p-4">

                    <h2 className="mb-4">
                        Skin Profile
                    </h2>

                    <form onSubmit={handleSubmit}>

                        <div className="mb-3">

                            <label>Age</label>

                            <input
                                type="number"
                                className="form-control"
                                name="age"
                                value={form.age}
                                onChange={handleChange}
                                required
                            />

                        </div>

                        <div className="mb-3">

                            <label>Gender</label>

                            <select
                                className="form-select"
                                name="gender"
                                value={form.gender}
                                onChange={handleChange}
                                required
                            >

                                <option value="">Select</option>
                                <option>Male</option>
                                <option>Female</option>
                                <option>Other</option>

                            </select>

                        </div>

                        <div className="mb-3">

                            <label>Skin Type</label>

                            <select
                                className="form-select"
                                name="skin_type"
                                value={form.skin_type}
                                onChange={handleChange}
                                required
                            >

                                <option value="">Select</option>
                                <option>Normal</option>
                                <option>Dry</option>
                                <option>Oily</option>
                                <option>Combination</option>
                                <option>Sensitive</option>

                            </select>

                        </div>

                        <div className="mb-3">

                            <label>Skin Concerns</label>

                            <textarea
                                rows="3"
                                className="form-control"
                                name="skin_concerns"
                                value={form.skin_concerns}
                                onChange={handleChange}
                            />

                        </div>

                        <div className="mb-3">

                            <label>Allergies</label>

                            <textarea
                                rows="2"
                                className="form-control"
                                name="allergies"
                                value={form.allergies}
                                onChange={handleChange}
                            />

                        </div>

                        <div className="mb-3">

                            <label>Sensitivities</label>

                            <textarea
                                rows="2"
                                className="form-control"
                                name="sensitivities"
                                value={form.sensitivities}
                                onChange={handleChange}
                            />

                        </div>

                        <div className="mb-4">

                            <label className="form-label">

                                Upload Skin Image

                            </label>

                            <input
                                type="file"
                                accept="image/*"
                                className="form-control"
                                onChange={handleImage}
                            />

                        </div>

                        {preview && (

                            <div className="text-center mb-4">

                                <img
                                    src={preview}
                                    alt="Skin"
                                    style={{
                                        width: "250px",
                                        borderRadius: "15px"
                                    }}
                                />

                            </div>

                        )}

                        <button className="btn btn-primary">

                            Save Profile

                        </button>

                    </form>

                    {message && (

                        <div className="alert alert-success mt-4">

                            {message}

                        </div>

                    )}

                    {skinScore && (

                        <div className="card mt-4 p-4">

                            <h3>AI Skin Analysis Report</h3>

                            <hr />

                            <p><b>Skin Score:</b> {skinScore}/100</p>

                            <p><b>Skin Type:</b> {aiType}</p>

                            <p><b>Acne Level:</b> {analysis.acne_level}</p>

                            <p><b>Pigmentation:</b> {analysis.pigmentation}</p>

                            <p><b>Hydration:</b> {analysis.hydration}</p>

                            <p><b>Oiliness:</b> {analysis.oiliness}</p>

                            <p><b>Dark Circles:</b> {analysis.dark_circles}</p>

                            <hr />

                            <h5>Recommendations</h5>

                            <ul>

                                {(analysis.recommendations
                                    ? analysis.recommendations.split("\n")
                                    : []).map((item, index) =>

                                    item.trim() !== "" && (
                                        <li key={index}>{item}</li>
                                    )

                                )}

                            </ul>

                        </div>

                    )}

                </div>

            </div>

        </DashboardLayout>

    );

}

export default SkinProfile;