import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import api from "../services/api";

function Lifestyle() {

    const [form, setForm] = useState({
        sleep_duration: "",
        water_intake: "",
        exercise: "",
        stress_level: "",
        environmental_exposure: ""
    });

    const [message, setMessage] = useState("");
    const [profileExists, setProfileExists] = useState(false);

    useEffect(() => {
        loadLifestyle();
    }, []);

    const loadLifestyle = async () => {

        try {

            const response = await api.get("/lifestyle/");

            setForm({
                sleep_duration: response.data.sleep_duration,
                water_intake: response.data.water_intake,
                exercise: response.data.exercise,
                stress_level: response.data.stress_level,
                environmental_exposure: response.data.environmental_exposure
            });

            setProfileExists(true);

        } catch (error) {

            if (error.response && error.response.status === 404) {
                setProfileExists(false);
            }

        }

    };

    const handleChange = (e) => {

        setForm({
            ...form,
            [e.target.name]: e.target.value
        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            if (profileExists) {

                await api.put("/lifestyle/", form);

                setMessage("Lifestyle Updated Successfully");

            } else {

                await api.post("/lifestyle/", form);

                setMessage("Lifestyle Added Successfully");

                setProfileExists(true);

            }

        }

        catch (error) {

            if (error.response) {

                setMessage(error.response.data.detail);

            }

            else {

                setMessage("Unable to connect to server");

            }

        }

    };

    return (

        <MainLayout>

            <div className="page-container">

               <div className="glass-card">

                        <h2 className="mb-4">

                            Lifestyle Tracking

                        </h2>

                        <form onSubmit={handleSubmit}>

                            <div className="mb-3">

                                <label className="form-label">

                                    Sleep Duration (Hours)

                                </label>

                                <input
                                    type="number"
                                    step="0.5"
                                    name="sleep_duration"
                                    className="form-control"
                                    value={form.sleep_duration}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            <div className="mb-3">

                                <label className="form-label">

                                    Water Intake (Liters)

                                </label>

                                <input
                                    type="number"
                                    step="0.5"
                                    name="water_intake"
                                    className="form-control"
                                    value={form.water_intake}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            <div className="mb-3">

                                <label className="form-label">

                                    Exercise Habits

                                </label>

                                <input
                                    type="text"
                                    name="exercise"
                                    className="form-control"
                                    value={form.exercise}
                                    onChange={handleChange}
                                    placeholder="Example: Walking 30 minutes"
                                    required
                                />

                            </div>

                            <div className="mb-3">

                                <label className="form-label">

                                    Stress Level

                                </label>

                                <select
                                    name="stress_level"
                                    className="form-select"
                                    value={form.stress_level}
                                    onChange={handleChange}
                                    required
                                >

                                    <option value="">Select</option>
                                    <option value="Low">Low</option>
                                    <option value="Moderate">Moderate</option>
                                    <option value="High">High</option>

                                </select>

                            </div>

                            <div className="mb-3">

                                <label className="form-label">

                                    Environmental Exposure

                                </label>

                                <textarea
                                    rows="3"
                                    name="environmental_exposure"
                                    className="form-control"
                                    value={form.environmental_exposure}
                                    onChange={handleChange}
                                    placeholder="Example: Pollution, Sunlight, Dust..."
                                    required
                                />

                            </div>

                            <button
                                className="primary-button"
                            >
                                {profileExists ? "Update Lifestyle" : "Save Lifestyle"}
                            </button>

                        </form>

                        {message && (

                            <div className="alert alert-success mt-3">

                                {message}

                            </div>

                        )}

                </div>

            </div>

        </MainLayout>

    );

}

export default Lifestyle;