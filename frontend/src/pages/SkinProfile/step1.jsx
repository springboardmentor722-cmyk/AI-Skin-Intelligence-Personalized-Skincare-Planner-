import { User, Calendar, Users } from "lucide-react";
import { motion } from "framer-motion";

function Step1({ formData, setFormData }) {
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
          Personal Information
        </h2>

        <p className="text-gray-500 mt-2">
          Tell us a little about yourself.
        </p>
      </div>

      {/* Full Name */}
      <div className="mb-6">
        <label className="block mb-2 font-semibold text-gray-700">
          Full Name
        </label>

        <div className="relative">
          <User
            size={20}
            className="absolute left-4 top-4 text-gray-400"
          />

          <input
            type="text"
            name="fullName"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={handleChange}
            className="w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      {/* Age */}
      <div className="mb-6">
        <label className="block mb-2 font-semibold text-gray-700">
          Age
        </label>

        <div className="relative">
          <Calendar
            size={20}
            className="absolute left-4 top-4 text-gray-400"
          />

          <input
            type="number"
            name="age"
            placeholder="Enter your age"
            value={formData.age}
            onChange={handleChange}
            min="10"
            max="100"
            className="w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      {/* Gender */}
      <div>
        <label className="block mb-2 font-semibold text-gray-700">
          Gender
        </label>

        <div className="relative">
          <Users
            size={20}
            className="absolute left-4 top-4 text-gray-400"
          />

          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>
    </motion.div>
  );
}

export default Step1;