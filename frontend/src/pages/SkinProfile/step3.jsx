import { motion } from "framer-motion";
import {
  CircleDot,
  Sparkles,
  Droplets,
  Sun,
  Wind,
  Heart,
  Eye,
  ShieldAlert,
  Smile,
  Layers,
} from "lucide-react";

const concernList = [
  {
    name: "Acne",
    icon: <CircleDot size={35} className="text-red-500" />,
    description: "Breakouts & Pimples",
  },
  {
    name: "Dark Spots",
    icon: <Sparkles size={35} className="text-purple-500" />,
    description: "Hyperpigmentation",
  },
  {
    name: "Oiliness",
    icon: <Droplets size={35} className="text-blue-500" />,
    description: "Excess Sebum",
  },
  {
    name: "Dryness",
    icon: <Wind size={35} className="text-cyan-500" />,
    description: "Lack of Moisture",
  },
  {
    name: "Pigmentation",
    icon: <Sun size={35} className="text-yellow-500" />,
    description: "Uneven Skin Tone",
  },
  {
    name: "Wrinkles",
    icon: <Smile size={35} className="text-pink-500" />,
    description: "Fine Lines",
  },
  {
    name: "Sensitive Skin",
    icon: <ShieldAlert size={35} className="text-orange-500" />,
    description: "Skin Irritation",
  },
  {
    name: "Dark Circles",
    icon: <Eye size={35} className="text-indigo-500" />,
    description: "Under Eye Concern",
  },
  {
    name: "Large Pores",
    icon: <Layers size={35} className="text-green-500" />,
    description: "Visible Pores",
  },
  {
    name: "Redness",
    icon: <Heart size={35} className="text-red-400" />,
    description: "Skin Redness",
  },
];

function Step3({ formData, setFormData }) {
  const toggleConcern = (concern) => {
    let updated = [...formData.concerns];

    if (updated.includes(concern)) {
      updated = updated.filter((item) => item !== concern);
    } else {
      updated.push(concern);
    }

    setFormData({
      ...formData,
      concerns: updated,
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
          Skin Concerns
        </h2>

        <p className="text-gray-500 mt-2">
          Select all concerns that apply to your skin.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {concernList.map((item) => (
          <div
            key={item.name}
            onClick={() => toggleConcern(item.name)}
            className={`cursor-pointer border-2 rounded-2xl p-5 transition duration-300 hover:shadow-lg ${
              formData.concerns.includes(item.name)
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200"
            }`}
          >
            <div className="flex items-center gap-4">
              {item.icon}

              <div>
                <h3 className="text-lg font-bold">
                  {item.name}
                </h3>

                <p className="text-sm text-gray-500">
                  {item.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Count */}
      <div className="mt-8 text-center">
        <p className="font-semibold text-blue-600">
          Selected Concerns: {formData.concerns.length}
        </p>
      </div>
    </motion.div>
  );
}

export default Step3;