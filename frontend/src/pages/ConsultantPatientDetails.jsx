import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import ConsultantLayout from "../layouts/ConsultantLayout";
import {
  getPatientDetails,
  reviewAppointment,
} from "../services/consultantService";

function ConsultantPatientDetails() {

  const { appointmentId } = useParams();

  const [patient, setPatient] = useState(null);

  const [loading, setLoading] = useState(true);

  const [review, setReview] = useState({
    status: "APPROVED",
    consultant_notes: "",
    dermatologist_recommended: false,
  });

  useEffect(() => {

    getPatientDetails(appointmentId)
      .then((data) => {
        setPatient(data);
      })
      .catch((error) => {
        console.error(error);
        alert("Failed to load patient details.");
      })
      .finally(() => {
        setLoading(false);
      });

  }, [appointmentId]);

  const handleSubmit = async () => {

    try {

      await reviewAppointment(
        appointmentId,
        review
      );

      alert("Review submitted successfully.");

    } catch (error) {

      console.error(error);

      alert("Failed to submit review.");

    }

  };

  if (loading) {

    return (

      <ConsultantLayout>

        <div className="text-center py-20 text-xl">
          Loading Patient...
        </div>

      </ConsultantLayout>

    );

  }

  return (

    <ConsultantLayout>

      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-blue-700 via-cyan-600 to-teal-500 p-10 mb-10 shadow-xl">

  <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10"></div>

  <div className="flex justify-between items-center">

    <div>

      <p className="text-blue-100 text-lg">
        Consultation Review
      </p>

      <h1 className="text-5xl font-bold text-white mt-2">
        {patient.patient.full_name}
      </h1>

      <p className="text-blue-50 mt-5 text-lg max-w-2xl">
        Review patient information, evaluate AI assessment, and provide your professional consultation.
      </p>

    </div>

    <div className="hidden lg:flex">

      <div className="w-32 h-32 rounded-full bg-white/15 flex items-center justify-center text-6xl">

        👨‍⚕️

      </div>

    </div>

  </div>

</div>

      {/* Patient */}

      <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">

  <h2 className="text-2xl font-bold mb-8">
    Patient Information
  </h2>

  <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">

    <div className="bg-gray-50 rounded-2xl p-6">

      <p className="text-gray-500 text-sm">
        Full Name
      </p>

      <h3 className="font-bold text-xl mt-2">
        {patient.patient.full_name}
      </h3>

    </div>

    <div className="bg-gray-50 rounded-2xl p-6">

      <p className="text-gray-500 text-sm">
        Email
      </p>

      <h3 className="font-semibold mt-2 break-all">
        {patient.patient.email}
      </h3>

    </div>

    <div className="bg-gray-50 rounded-2xl p-6">

      <p className="text-gray-500 text-sm">
        Age
      </p>

      <h3 className="font-bold text-xl mt-2">
        {patient.patient.age}
      </h3>

    </div>

    <div className="bg-gray-50 rounded-2xl p-6">

      <p className="text-gray-500 text-sm">
        Gender
      </p>

      <h3 className="font-bold text-xl mt-2">
        {patient.patient.gender}
      </h3>

    </div>

  </div>

</div>

      {/* Skin Profile */}

      <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">

  <h2 className="text-2xl font-bold mb-8">
    Skin Profile
  </h2>

  <div className="grid md:grid-cols-3 gap-6">

    <div className="bg-blue-50 rounded-2xl p-6 hover:shadow-lg transition">

      <div className="text-4xl mb-4">
        
      </div>

      <p className="text-gray-500 text-sm">
        Skin Type
      </p>

      <h3 className="text-2xl font-bold mt-2">
        {patient.skin_profile?.skin_type || "N/A"}
      </h3>

    </div>

    <div className="bg-yellow-50 rounded-2xl p-6 hover:shadow-lg transition">

      <div className="text-4xl mb-4">
        
      </div>

      <p className="text-gray-500 text-sm">
        Sensitivity
      </p>

      <h3 className="text-2xl font-bold mt-2">
        {patient.skin_profile?.sensitivity || "N/A"}
      </h3>

    </div>

    <div className="bg-red-50 rounded-2xl p-6 hover:shadow-lg transition">

      <div className="text-4xl mb-4">
        
      </div>

      <p className="text-gray-500 text-sm">
        Allergies
      </p>

      <h3 className="text-xl font-bold mt-2 break-words">
        {patient.skin_profile?.allergies || "None"}
      </h3>

    </div>

  </div>

</div>

      {/* Lifestyle */}

      <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">

  <h2 className="text-2xl font-bold mb-8">
    Lifestyle Analysis
  </h2>

  <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-6">

    <div className="bg-indigo-50 rounded-2xl p-6 hover:shadow-lg transition">

      <div className="text-4xl mb-4"></div>

      <p className="text-gray-500 text-sm">
        Sleep
      </p>

      <h3 className="text-2xl font-bold mt-2">
        {patient.lifestyle?.sleep_duration || "N/A"} hrs
      </h3>

    </div>

    <div className="bg-cyan-50 rounded-2xl p-6 hover:shadow-lg transition">

      <div className="text-4xl mb-4"></div>

      <p className="text-gray-500 text-sm">
        Water Intake
      </p>

      <h3 className="text-2xl font-bold mt-2">
        {patient.lifestyle?.water_intake || "N/A"} L
      </h3>

    </div>

    <div className="bg-green-50 rounded-2xl p-6 hover:shadow-lg transition">

      <div className="text-4xl mb-4"></div>

      <p className="text-gray-500 text-sm">
        Exercise
      </p>

      <h3 className="text-lg font-bold mt-2">
        {patient.lifestyle?.exercise_habits || "N/A"}
      </h3>

    </div>

    <div className="bg-yellow-50 rounded-2xl p-6 hover:shadow-lg transition">

      <div className="text-4xl mb-4"></div>

      <p className="text-gray-500 text-sm">
        Stress Level
      </p>

      <h3 className="text-xl font-bold mt-2">
        {patient.lifestyle?.stress_level || "N/A"}
      </h3>

    </div>

    <div className="bg-purple-50 rounded-2xl p-6 hover:shadow-lg transition">

      <div className="text-4xl mb-4"></div>

      <p className="text-gray-500 text-sm">
        Environment
      </p>

      <h3 className="text-lg font-bold mt-2">
        {patient.lifestyle?.environmental_exposure || "N/A"}
      </h3>

    </div>

  </div>

</div>

      {/* Assessment */}

      <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">

  <h2 className="text-2xl font-bold mb-8">
    AI Skin Assessment Report
  </h2>

  <div className="grid lg:grid-cols-5 gap-6">

    {/* Overall Score */}

    <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl text-white p-8 lg:col-span-2">

      <p className="text-blue-100">
        Overall Skin Score
      </p>

      <h1 className="text-6xl font-bold mt-3">
        {patient.latest_assessment?.overall_score || 0}
      </h1>

      <p className="mt-3 text-blue-100">
        AI Skin Health Index
      </p>

    </div>

    {/* Acne */}

    <div className="bg-red-50 rounded-2xl p-6">

      <div className="text-4xl mb-4">
        
      </div>

      <p className="text-gray-500">
        Acne
      </p>

      <h2 className="text-3xl font-bold mt-2">
        {patient.latest_assessment?.acne_score || 0}
      </h2>

    </div>

    {/* Pigmentation */}

    <div className="bg-yellow-50 rounded-2xl p-6">

      <div className="text-4xl mb-4">
        
      </div>

      <p className="text-gray-500">
        Pigmentation
      </p>

      <h2 className="text-3xl font-bold mt-2">
        {patient.latest_assessment?.pigmentation_score || 0}
      </h2>

    </div>

    {/* Redness */}

    <div className="bg-pink-50 rounded-2xl p-6">

      <div className="text-4xl mb-4">
        
      </div>

      <p className="text-gray-500">
        Redness
      </p>

      <h2 className="text-3xl font-bold mt-2">
        {patient.latest_assessment?.redness_score || 0}
      </h2>

    </div>

  </div>

  {/* Wrinkles */}

  <div className="mt-6 grid md:grid-cols-2 gap-6">

    <div className="bg-purple-50 rounded-2xl p-6">

      <div className="text-4xl mb-4">
        
      </div>

      <p className="text-gray-500">
        Wrinkles
      </p>

      <h2 className="text-3xl font-bold mt-2">
        {patient.latest_assessment?.wrinkles_score || 0}
      </h2>

    </div>

    <div className="bg-green-50 rounded-2xl p-6">

      <div className="text-4xl mb-4">
        🤖
      </div>

      <p className="text-gray-500">
        AI Analysis
      </p>

      <p className="mt-3 text-gray-700 leading-7">

        AI has analyzed the patient's skin based on uploaded images,
        skin profile, and lifestyle information. Review these findings
        before approving or referring the patient.

      </p>

    </div>

  </div>

</div>

      {/* Consultant Review */}

      <div className="bg-white rounded-3xl shadow-xl p-8 mb-10">

  <h2 className="text-2xl font-bold mb-8">
    Consultant Review
  </h2>

  <div className="space-y-8">

    {/* Notes */}

    <div>

      <label className="block font-semibold text-lg mb-3">
        Consultation Notes
      </label>

      <textarea
        rows="7"
        value={review.consultant_notes}
        onChange={(e) =>
          setReview({
            ...review,
            consultant_notes: e.target.value,
          })
        }
        className="w-full border border-gray-300 rounded-2xl p-5 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
        placeholder="Write your medical observations, recommendations, diagnosis and consultation notes..."
      />

    </div>

    {/* Recommendation */}

    <div className="bg-blue-50 rounded-2xl p-6">

      <div className="flex items-center justify-between">

        <div>

          <h3 className="text-xl font-semibold">
            Dermatologist Referral
          </h3>

          <p className="text-gray-500 mt-1">
            Refer this patient to a dermatologist if specialist care is required.
          </p>

        </div>

        <label className="flex items-center gap-3">

          <input
            type="checkbox"
            checked={review.dermatologist_recommended}
            onChange={(e) =>
              setReview({
                ...review,
                dermatologist_recommended: e.target.checked,
              })
            }
            className="w-6 h-6"
          />

          <span className="font-semibold">
            Recommend
          </span>

        </label>

      </div>

    </div>

    {/* Information */}

    <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-xl p-5">

      <h3 className="font-bold text-yellow-700">
        Before submitting
      </h3>

      <ul className="mt-3 text-gray-700 list-disc list-inside space-y-2">

        <li>Review AI assessment carefully.</li>

        <li>Verify lifestyle and skin profile.</li>

        <li>Provide professional consultation notes.</li>

        <li>Recommend dermatologist only if necessary.</li>

      </ul>

    </div>

    {/* Buttons */}

    <div className="flex flex-wrap gap-5">

      <button
        onClick={() => {
          setReview({
            ...review,
            status: "APPROVED",
          });

          handleSubmit();
        }}
        className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg transition"
      >
        ✅ Approve Patient
      </button>

      <button
        onClick={() => {
          setReview({
            ...review,
            status: "REJECTED",
          });

          handleSubmit();
        }}
        className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg transition"
      >
        ❌ Reject Patient
      </button>

    </div>

  </div>

</div>

      

    </ConsultantLayout>

  );

}

export default ConsultantPatientDetails;