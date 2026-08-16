import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { FaEye, FaEyeSlash } from "react-icons/fa";
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
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    setMessage("");
    setIsSuccess(false);

    if (form.password !== confirmPassword) {
        setMessage("Passwords do not match");
        return;
    }

    const data = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,

        qualification:
            form.role === "CONSULTANT" || form.role === "DERMATOLOGIST"
                ? form.qualification.trim()
                : null,

        experience:
            form.role === "CONSULTANT" || form.role === "DERMATOLOGIST"
                ? Number(form.experience)
                : null,

        specialization:
            form.role === "CONSULTANT" || form.role === "DERMATOLOGIST"
                ? form.specialization.trim()
                : null,

        license_number:
            form.role === "DERMATOLOGIST"
                ? form.license_number.trim()
                : null,

        organization:
            form.role === "CONSULTANT" || form.role === "DERMATOLOGIST"
                ? form.organization.trim()
                : null
    };

    try {

        const response = await api.post("/register", data);

        setIsSuccess(true);
        setMessage(response.data.message);

        setTimeout(() => {
            navigate("/");
        }, 1500);

    } catch (error) {

        console.error("Registration error:", error);

        setIsSuccess(false);

        if (error.response) {

            console.log("Backend response:", error.response.data);

            if (Array.isArray(error.response.data.detail)) {

                setMessage(
                    error.response.data.detail
                        .map(item => item.msg)
                        .join(", ")
                );

            } else {

                setMessage(
                    error.response.data.detail ||
                    "Registration failed"
                );

            }

        } else {

            setMessage("Unable to connect to server");

        }
    }
};

   return (

<div className="login-page">

    <div className="left-side">

        <div className="left-content">

            <h1>ðŸŒ¿ Skin Intelligence</h1>

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

                    <div className="password-input">
                    <input
                        type={showPassword ? "text" : "password"}
                        className="form-control"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                    />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}</button>
                    </div>

                </div>

                <div className="mb-3">

                    <label>Confirm Password</label>

                    <div className="password-input">
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        className="form-control"
                        value={confirmPassword}
                        onChange={(e)=>setConfirmPassword(e.target.value)}
                        required
                    />
                    <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}>{showConfirmPassword ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}</button>
                    </div>

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
