import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import "../styles/register.css";
function Register() {

    const navigate = useNavigate();

    const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER",

    qualification: "",
    experience: "",
    specialization: "",
    license_number: "",
    organization: ""
});

    const [confirmPassword, setConfirmPassword] = useState("");

    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    const handleChange = (e) => {

        setForm({
            ...form,
            [e.target.name]: e.target.value
        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (form.password !== confirmPassword) {

            setIsSuccess(false);
            setMessage("Passwords do not match");
            return;

        }

        try {

            const response = await api.post("/register", form);

            setIsSuccess(true);
            setMessage(response.data.message);

            setTimeout(() => {

                navigate("/");

            }, 1500);

        }

        catch (error) {

            setIsSuccess(false);

            if (error.response) {

                setMessage(error.response.data.detail);

            }

            else {

                setMessage("Unable to connect to server");

            }

        }

    };

   return (

<div className="login-page">

    <div className="left-side">

        <div className="left-content">

            <h1>🌿 AI Skin Intelligence</h1>

            <h3>Create Your Account</h3>

            <p>

                Join our AI-powered skincare platform and receive
                personalized recommendations based on your skin profile.

            </p>

        </div>

    </div>

    <div className="right-side">

        <div className="login-card register-card">

            <h2 className="text-center mb-4">

                Register

            </h2>

            <form onSubmit={handleSubmit}>

                <div className="mb-3">

                    <label>Name</label>

                    <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                    />

                </div>

                <div className="mb-3">

                    <label>Email</label>

                    <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />

                </div>

                <div className="mb-3">

                    <label>Password</label>

                    <input
                        type="password"
                        className="form-control"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                    />

                </div>

                <div className="mb-3">

                    <label>Confirm Password</label>

                    <input
                        type="password"
                        className="form-control"
                        value={confirmPassword}
                        onChange={(e)=>setConfirmPassword(e.target.value)}
                        required
                    />

                </div>

                <div className="mb-3">

                    <label>Role</label>

                    <select
                        className="form-select"
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                    >

                        <option value="USER">User</option>

                        <option value="CONSULTANT">

                            Skincare Consultant

                        </option>

                        <option value="DERMATOLOGIST">

                            Dermatologist

                        </option>

                    </select>

                </div>

                {(form.role==="CONSULTANT" ||

                form.role==="DERMATOLOGIST") && (

                <>

                    <div className="mb-3">

                        <label>Qualification</label>

                        <input
                            className="form-control"
                            name="qualification"
                            value={form.qualification}
                            onChange={handleChange}
                            required
                        />

                    </div>

                    <div className="mb-3">

                        <label>Experience</label>

                        <input
                            type="number"
                            className="form-control"
                            name="experience"
                            value={form.experience}
                            onChange={handleChange}
                            required
                        />

                    </div>

                    <div className="mb-3">

                        <label>Organization</label>

                        <input
                            className="form-control"
                            name="organization"
                            value={form.organization}
                            onChange={handleChange}
                            required
                        />

                    </div>

                    <div className="mb-3">

                        <label>Specialization</label>

                        <input
                            className="form-control"
                            name="specialization"
                            value={form.specialization}
                            onChange={handleChange}
                            required
                        />

                    </div>

                    {form.role==="DERMATOLOGIST" && (

                    <div className="mb-3">

                        <label>Medical License Number</label>

                        <input
                            className="form-control"
                            name="license_number"
                            value={form.license_number}
                            onChange={handleChange}
                            required
                        />

                    </div>

                    )}

                </>

                )}

                <button className="login-btn">

                    {

                    form.role==="USER"

                    ?

                    "Create Account"

                    :

                    "Submit For Verification"

                    }

                </button>

            </form>

            {

            message &&

            <div

            className={`alert mt-3 ${isSuccess ? "alert-success":"alert-danger"}`}

            >

                {message}

            </div>

            }

            <p className="text-center mt-4">

                Already have an account?

                <Link to="/">

                    Login

                </Link>

            </p>

        </div>

    </div>

</div>

);

}

export default Register;