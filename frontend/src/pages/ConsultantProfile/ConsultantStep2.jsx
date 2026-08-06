import { motion } from "framer-motion";

function ConsultantStep2({
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
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white shadow-2xl rounded-3xl w-full max-w-2xl p-10"
      >

        <h1 className="text-4xl font-bold text-green-700 text-center">
          Professional Details
        </h1>

        <p className="text-center text-gray-500 mt-2">
          Step 2 of 5
        </p>

        <div className="w-full bg-gray-200 rounded-full h-3 mt-8">
          <div className="bg-green-600 h-3 rounded-full w-2/5"></div>
        </div>

        <div className="mt-10 space-y-6">

          <input
            type="text"
            name="qualification"
            placeholder="Qualification"
            value={formData.qualification}
            onChange={handleChange}
            className="w-full border rounded-xl p-4"
          />

          <input
            type="text"
            name="specialization"
            placeholder="Specialization"
            value={formData.specialization}
            onChange={handleChange}
            className="w-full border rounded-xl p-4"
          />

         <input
  type="number"
  name="experience"
  value={formData.experience}
  onChange={(e) =>
    setFormData({
      ...formData,
      experience: Number(e.target.value),
    })
  }
/>

        </div>

        <div className="flex justify-between mt-10">

          <button
            onClick={prevStep}
            className="bg-gray-400 text-white px-8 py-3 rounded-xl"
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

export default ConsultantStep2;