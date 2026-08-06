import { motion } from "framer-motion";
import {
  Droplets,
  Leaf,
  Sparkles,
  Shield,
  Heart,
} from "lucide-react";

const skinTypes = [
  {
    name: "Oily",
    icon: <Droplets size={35} className="text-blue-500" />,
    description: "Produces excess oil",
  },
  {
    name: "Dry",
    icon: <Leaf size={35} className="text-yellow-500" />,
    description: "Needs extra hydration",
  },
  {
    name: "Combination",
    icon: <Sparkles size={35} className="text-purple-500" />,
    description: "Oily & dry areas",
  },
  {
    name: "Normal",
    icon: <Shield size={35} className="text-green-500" />,
    description: "Balanced skin",
  },
  {
    name: "Sensitive",
    icon: <Heart size={35} className="text-red-500" />,
    description: "Easily irritated",
  },
];

function Step2({ formData, setFormData }) {
  const handleSkinType = (type) => {
    setFormData({
      ...formData,
      skinType: type,
    });
  };

  const handleSkinTone = (e) => {
    setFormData({
      ...formData,
      skinTone: e.target.value,
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
          Skin Details
        </h2>

        <p className="text-gray-500 mt-2">
          Select your skin type and tone.
        </p>
      </div>

      {/* Skin Type */}
      <h3 className="text-lg font-semibold mb-4">
        Choose Your Skin Type
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {skinTypes.map((skin) => (
          <div
            key={skin.name}
            onClick={() => handleSkinType(skin.name)}
            className={`cursor-pointer border-2 rounded-2xl p-5 transition duration-300 hover:shadow-lg ${
              formData.skinType === skin.name
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200"
            }`}
          >
            <div className="flex items-center gap-4">
              {skin.icon}

              <div>
                <h4 className="text-lg font-bold">
                  {skin.name}
                </h4>

                <p className="text-sm text-gray-500">
                  {skin.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Skin Tone */}
      <div className="mt-8">
        <label className="block mb-2 font-semibold text-gray-700">
          Skin Tone
        </label>

        <select
          value={formData.skinTone}
          onChange={handleSkinTone}
          className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Skin Tone</option>
          <option value="Fair">Fair</option>
          <option value="Light">Light</option>
          <option value="Medium">Medium</option>
          <option value="Olive">Olive</option>
          <option value="Brown">Brown</option>
          <option value="Dark">Dark</option>
        </select>
      </div>
    </motion.div>
  );
}

export default Step2;