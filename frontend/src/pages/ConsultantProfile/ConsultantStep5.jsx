import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function ConsultantStep5({
  prevStep,
  formData,
}) {
  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      await api.post("/consultant/profile", formData);

      alert("Profile Created Successfully!");

      navigate("/consultant-dashboard");

    } catch (err) {
  console.log("Full Error:", err);
  console.log("Response:", err.response);
  console.log("Data:", err.response?.data);

  alert(JSON.stringify(err.response?.data, null, 2));
}
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-white flex justify-center items-center">

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white shadow-2xl rounded-3xl w-full max-w-3xl p-10"
      >

        <h1 className="text-4xl font-bold text-green-700 text-center">
          Review Your Information
        </h1>

        <p className="text-center text-gray-500 mt-2">
          Step 5 of 5
        </p>

        {/* Progress Bar */}

        <div className="w-full bg-gray-200 rounded-full h-3 mt-8">

          <div className="bg-green-600 h-3 rounded-full w-full"></div>

        </div>

        <div className="grid grid-cols-2 gap-6 mt-10">

          <div>
            <strong>Full Name</strong>
            <p>{formData.full_name}</p>
          </div>

          <div>
            <strong>Phone</strong>
            <p>{formData.phone}</p>
          </div>

          <div>
            <strong>City</strong>
            <p>{formData.city}</p>
          </div>

          <div>
            <strong>Qualification</strong>
            <p>{formData.qualification}</p>
          </div>

          <div>
            <strong>Specialization</strong>
            <p>{formData.specialization}</p>
          </div>

          <div>
            <strong>Experience</strong>
            <p>{formData.experience}</p>
          </div>

          <div>
            <strong>Hospital</strong>
            <p>{formData.hospital}</p>
          </div>

          <div>
            <strong>Department</strong>
            <p>{formData.department}</p>
          </div>

          <div>
            <strong>Available Days</strong>
            <p>{formData.available_days}</p>
          </div>

          <div>
            <strong>Languages</strong>
            <p>{formData.languages}</p>
          </div>

        </div>

        <div className="flex justify-between mt-10">

          <button
            onClick={prevStep}
            className="bg-gray-500 text-white px-8 py-3 rounded-xl hover:bg-gray-600"
          >
            ← Previous
          </button>

          <button
            onClick={handleSubmit}
            className="bg-green-600 text-white px-8 py-3 rounded-xl hover:bg-green-700"
          >
            Save & Continue
          </button>

        </div>

      </motion.div>

    </div>
  );
}

export default ConsultantStep5;