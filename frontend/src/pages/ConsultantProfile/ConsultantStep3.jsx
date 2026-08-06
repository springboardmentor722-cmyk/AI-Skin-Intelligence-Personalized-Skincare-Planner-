import { motion } from "framer-motion";

function ConsultantStep3({
  nextStep,
  prevStep,
  formData,
  setFormData,
}) {
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-white flex justify-center items-center">

      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white shadow-2xl rounded-3xl w-full max-w-2xl p-10"
      >

        <h1 className="text-4xl font-bold text-green-700 text-center">
          Hospital Information
        </h1>

        <p className="text-center text-gray-500 mt-2">
          Step 3 of 5
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mt-8">
          <div className="bg-green-600 h-3 rounded-full w-3/5"></div>
        </div>

        <div className="mt-10 space-y-6">

          <input
            type="text"
            name="hospital"
            placeholder="Hospital / Clinic Name"
            value={formData.hospital}
            onChange={handleChange}
            className="w-full border rounded-xl p-4"
          />

          <input
            type="text"
            name="department"
            placeholder="Department"
            value={formData.department}
            onChange={handleChange}
            className="w-full border rounded-xl p-4"
          />

        </div>

        <div className="flex justify-between mt-10">

          <button
            onClick={prevStep}
            className="bg-gray-500 text-white px-8 py-3 rounded-xl hover:bg-gray-600"
          >
            ← Previous
          </button>

          <button
            onClick={nextStep}
            className="bg-green-600 text-white px-8 py-3 rounded-xl hover:bg-green-700"
          >
            Next →
          </button>

        </div>

      </motion.div>

    </div>
  );
}

export default ConsultantStep3;