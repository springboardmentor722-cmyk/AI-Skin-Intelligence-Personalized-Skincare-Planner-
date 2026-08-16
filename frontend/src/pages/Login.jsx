import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../styles/login.css";
function Login() {

    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: "",
        password: ""
    });

    const [message, setMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

           const formData = new URLSearchParams();

formData.append("username", form.email);
formData.append("password", form.password);

const response = await api.post(
    "/login",
    formData,
    {
        headers: {
            "Content-Type":
                "application/x-www-form-urlencoded",
        },
    }
);

            localStorage.setItem(
    "token",
    response.data.access_token
);

localStorage.setItem(
    "name",
    response.data.name
);

localStorage.setItem(
    "email",
    response.data.email
);

localStorage.setItem(
    "role",
    response.data.role
);

navigate("/dashboard");

        }

     catch (error) {

    console.log(error);

    if (error.response) {

        setMessage(
            error.response.data.detail
        );

    } else {

        setMessage("Unable to connect to server");

    }

}

    };

    return (

<div className="login-page">

<div className="left-side">

<div>

<h1>ðŸŒ¿ Skin Intelligence</h1>

<p>

Personalized skincare powered by Artificial Intelligence.

</p>

</div>

</div>

<div className="right-side">

<div className="login-card">

<h2>

Welcome Back

</h2>

<form onSubmit={handleSubmit}>

<div className="mb-3">

<label>Email</label>

<input

type="email"

name="email"

className="form-control"

onChange={handleChange}

required

/>

</div>

<div className="mb-3">

<label>Password</label>

<div className="password-input">
<input

type={showPassword ? "text" : "password"}

name="password"

className="form-control"

onChange={handleChange}

required

/>
<button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
{showPassword ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
</button>
</div>

</div>

<button className="login-btn">

Login

</button>

</form>

{

message &&

<p className="error">

{message}

</p>

}

<p className="text-center mt-4">

Don't have an account?

<Link to="/register">

 Register

</Link>

</p>

</div>

</div>

</div>

);

}

export default Login;
