import { useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import { createAppointment } from "../services/appointmentService";
import { useEffect } from "react";
import axios from "axios";

import {
  
  FaCalendarAlt,
  FaNotesMedical,
  FaLeaf,
  FaSave,
} from "react-icons/fa";

function BookAppointment() {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
  dermatologist_id: "",
  appointment_date: "",
  reason: "",
});
const [dermatologists, setDermatologists] = useState([]);

useEffect(() => {

  const fetchDermatologists = async () => {

    try {

      const token = localStorage.getItem("token");

      const response = await axios.get(
        "http://127.0.0.1:8000/auth/dermatologists",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDermatologists(response.data);

    } catch (err) {

      console.error(err);

    }

  };

  fetchDermatologists();

}, []);

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      setLoading(true);

      await createAppointment(formData);

      alert("Appointment requested successfully.");

      navigate("/appointments");

    } catch (error) {

      console.error(error);
      alert("Failed to book appointment.");

    } finally {

      setLoading(false);

    }

  };

  return (

    <DashboardLayout>

      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-green-700 via-emerald-600 to-green-500 p-10 mb-10 shadow-xl">

  <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10"></div>

  <div className="flex justify-between items-center">

    <div>

      <p className="text-green-100 text-lg">
        AI Dermatology Consultation
      </p>

      <h1 className="text-5xl font-bold text-white mt-2">
        Book Appointment
      </h1>

      <p className="text-green-50 mt-5 text-lg max-w-2xl">
        Schedule a consultation with a dermatologist based on your AI skin assessment.
      </p>

    </div>

    <div className="hidden lg:flex">

      <div className="w-32 h-32 rounded-full bg-white/15 flex items-center justify-center">

        <FaLeaf className="text-white text-6xl"/>

      </div>

    </div>

  </div>

</div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-[32px] shadow-xl border border-gray-100 p-10 space-y-8"
      >

        <div>

          <div>

  <div className="flex items-center gap-3 mb-3">

    <FaLeaf className="text-green-600"/>

    <h2 className="text-xl font-bold">
      Select Dermatologist
    </h2>

  </div>

  <select

    name="dermatologist_id"

    value={formData.dermatologist_id}

    onChange={handleChange}

    className="w-full rounded-2xl border border-gray-200 p-4"

  >

    <option value="">
      Choose Dermatologist
    </option>

    {dermatologists.map((doctor) => (

      <option
        key={doctor.id}
        value={doctor.id}
      >
        {doctor.full_name}
      </option>

    ))}

  </select>

</div>

<div className="flex items-center gap-3 mb-3">

<FaCalendarAlt className="text-green-600"/>

<h2 className="text-xl font-bold">
Appointment Date & Time
</h2>

</div>

<input
type="datetime-local"
name="appointment_date"
value={formData.appointment_date}
onChange={handleChange}
className="w-full rounded-2xl border border-gray-200 p-4 focus:ring-2 focus:ring-green-500 outline-none"
/>

</div>

        <div>

<div className="flex items-center gap-3 mb-3">

<FaNotesMedical className="text-green-600"/>

<h2 className="text-xl font-bold">
Reason for Visit
</h2>

</div>

<textarea
rows={5}
name="reason"
value={formData.reason}
onChange={handleChange}
placeholder="Describe your skin concern..."
className="w-full rounded-3xl border border-gray-200 p-5 resize-none focus:ring-2 focus:ring-green-500 outline-none"
/>

</div>

        <div className="flex justify-center">

<button
type="submit"
disabled={loading}
className="flex items-center gap-3 px-12 py-5 rounded-3xl bg-gradient-to-r from-green-700 to-emerald-500 text-white text-lg font-bold shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-60"
>

<FaSave />

{loading ? "Submitting..." : "Book Appointment"}

</button>

</div>

      </form>

    </DashboardLayout>

  );

}

export default BookAppointment;