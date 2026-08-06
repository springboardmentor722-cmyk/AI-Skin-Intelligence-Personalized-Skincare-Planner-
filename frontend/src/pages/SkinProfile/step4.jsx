import { motion } from "framer-motion";
import {
  Droplets,
  Moon,
  Dumbbell,
  Brain,
  Sun,
} from "lucide-react";

function Step4({ formData, setFormData }) {

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-3xl shadow-xl p-8"
    >
      {/* Heading */}

      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-blue-700">
          Lifestyle Assessment
        </h2>

        <p className="text-gray-500 mt-2">
          Your lifestyle helps us recommend the best skincare routine.
        </p>
      </div>

      {/* Water Intake */}

      <div className="mb-6">
        <label className="flex items-center gap-2 font-semibold mb-2">
          <Droplets className="text-blue-500" size={20} />
          Daily Water Intake (Litres)
        </label>

        <input
          type="number"
          step="0.5"
          min="0"
          max="10"
          name="waterIntake"
          value={formData.waterIntake}
          onChange={handleChange}
          placeholder="Example: 2.5"
          className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Sleep */}

      <div className="mb-6">
        <label className="flex items-center gap-2 font-semibold mb-2">
          <Moon className="text-indigo-500" size={20} />
          Sleep Hours
        </label>

        <input
          type="number"
          min="0"
          max="24"
          name="sleepHours"
          value={formData.sleepHours}
          onChange={handleChange}
          placeholder="Example: 8"
          className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Exercise */}

      <div className="mb-6">
        <label className="flex items-center gap-2 font-semibold mb-2">
          <Dumbbell className="text-green-500" size={20} />
          Exercise Frequency
        </label>

        <select
          name="exercise"
          value={formData.exercise}
          onChange={handleChange}
          className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Exercise Frequency</option>
          <option value="Never">Never</option>
          <option value="1-2 Days/Week">1–2 Days / Week</option>
          <option value="3-5 Days/Week">3–5 Days / Week</option>
          <option value="Daily">Daily</option>
        </select>
      </div>

      {/* Stress */}

      <div className="mb-6">
        <label className="flex items-center gap-2 font-semibold mb-2">
          <Brain className="text-purple-500" size={20} />
          Stress Level
        </label>

        <select
          name="stressLevel"
          value={formData.stressLevel}
          onChange={handleChange}
          className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Stress Level</option>
          <option value="Low">Low</option>
          <option value="Moderate">Moderate</option>
          <option value="High">High</option>
        </select>
      </div>

      {/* Outdoor Exposure */}

      <div>
        <label className="flex items-center gap-2 font-semibold mb-2">
          <Sun className="text-yellow-500" size={20} />
          Outdoor Exposure
        </label>

        <select
          name="outdoorExposure"
          value={formData.outdoorExposure}
          onChange={handleChange}
          className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Outdoor Exposure</option>
          <option value="Less than 1 hour">Less than 1 hour</option>
          <option value="1 - 3 hours">1 – 3 hours</option>
          <option value="More than 3 hours">More than 3 hours</option>
        </select>
      </div>

    </motion.div>
  );
}

export default Step4;