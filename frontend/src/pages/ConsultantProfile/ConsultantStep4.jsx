import { motion } from "framer-motion";

function ConsultantStep4({
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
          Availability
        </h1>

        <p className="text-center text-gray-500 mt-2">
          Step 4 of 5
        </p>

        {/* Progress Bar */}

        <div className="w-full bg-gray-200 rounded-full h-3 mt-8">

          <div className="bg-green-600 h-3 rounded-full w-4/5"></div>

        </div>

        <div className="mt-10 space-y-6">

          <input
            type="text"
            name="available_days"
            placeholder="Available Days (Mon-Fri)"
            value={formData.available_days}
            onChange={handleChange}
            className="w-full border rounded-xl p-4"
          />

          <input
            type="text"
            name="languages"
            placeholder="Languages (English, Telugu...)"
            value={formData.languages}
            onChange={handleChange}
            className="w-full border rounded-xl p-4"
          />

        </div>

        <div className="flex justify-between mt-10">

          <button
            onClick={prevStep}
            className="bg-gray-500 text-white px-8 py-3 rounded-xl"
          >
            ← Previous
          </button>

          <button
            onClick={nextStep}
            className="bg-green-600 text-white px-8 py-3 rounded-xl hover:bg-green-700"
          >
            Review →
          </button>

        </div>

      </motion.div>

    </div>
  );
}

export default ConsultantStep4;