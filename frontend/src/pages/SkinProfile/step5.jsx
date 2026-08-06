import { motion } from "framer-motion";
import {
  FlaskConical,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

const allergyOptions = [
  "Fragrance",
  "Alcohol",
  "Retinol",
  "Salicylic Acid",
  "Niacinamide",
  "Vitamin C",
  "Essential Oils",
  "Parabens",
  "Sulfates",
  "None",
];

function Step5({ formData, setFormData }) {

  const toggleAllergy = (allergy) => {

    let updatedAllergies = [...formData.allergies];

    if (allergy === "None") {

      updatedAllergies =
        formData.allergies.includes("None")
          ? []
          : ["None"];

    } else {

      updatedAllergies = updatedAllergies.filter(
        (item) => item !== "None"
      );

      if (updatedAllergies.includes(allergy)) {

        updatedAllergies = updatedAllergies.filter(
          (item) => item !== allergy
        );

      } else {

        updatedAllergies.push(allergy);

      }
    }

    setFormData({
      ...formData,
      allergies: updatedAllergies,
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

        <FlaskConical
          size={55}
          className="mx-auto text-blue-600 mb-3"
        />

        <h2 className="text-3xl font-bold text-blue-700">
          Allergies & Sensitivities
        </h2>

        <p className="text-gray-500 mt-2">
          Select ingredients that your skin is sensitive to.
        </p>

      </div>

      {/* Allergy Cards */}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

        {allergyOptions.map((item) => {

          const selected =
            formData.allergies.includes(item);

          return (

            <div
              key={item}
              onClick={() => toggleAllergy(item)}
              className={`cursor-pointer rounded-2xl border-2 p-5 transition-all duration-300 hover:shadow-lg ${
                selected
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200"
              }`}
            >

              <div className="flex justify-between items-center">

                <span className="font-semibold">
                  {item}
                </span>

                {selected && (
                  <CheckCircle2
                    className="text-blue-600"
                    size={22}
                  />
                )}

              </div>

            </div>

          );

        })}

      </div>

      {/* Summary */}

      <div className="mt-10 bg-blue-50 rounded-2xl p-5">

        <div className="flex items-center gap-3 mb-3">

          <ShieldCheck
            className="text-blue-600"
            size={26}
          />

          <h3 className="font-bold text-lg">
            Profile Summary
          </h3>

        </div>

        <div className="grid md:grid-cols-2 gap-3 text-gray-700">

          <p>
            <strong>Name:</strong> {formData.fullName}
          </p>

          <p>
            <strong>Age:</strong> {formData.age}
          </p>

          <p>
            <strong>Gender:</strong> {formData.gender}
          </p>

          <p>
            <strong>Skin Type:</strong> {formData.skinType}
          </p>

          <p>
            <strong>Skin Tone:</strong> {formData.skinTone}
          </p>

          <p>
            <strong>Concerns:</strong>{" "}
            {formData.concerns.join(", ")}
          </p>

          <p>
            <strong>Water:</strong>{" "}
            {formData.waterIntake} L
          </p>

          <p>
            <strong>Sleep:</strong>{" "}
            {formData.sleepHours} hrs
          </p>

        </div>

      </div>

    </motion.div>
  );
}

export default Step5;