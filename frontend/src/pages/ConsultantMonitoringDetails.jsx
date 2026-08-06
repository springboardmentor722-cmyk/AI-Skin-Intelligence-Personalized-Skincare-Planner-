import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import ConsultantLayout from "../layouts/ConsultantLayout";
import {
  getPatientMonitoringDetails,
  sendRecommendation,
} from "../services/consultantMonitoringService";

function ConsultantMonitoringDetails() {

  const { userId } = useParams();

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  const [recommendation, setRecommendation] = useState("");

  const [recommendDermatologist, setRecommendDermatologist] =
    useState(false);

const handleRecommendation = async () => {

  try {

    await sendRecommendation(userId, {

      recommendation,

      recommend_dermatologist: recommendDermatologist,

    });

    alert("Recommendation sent successfully!");

    setRecommendation("");

    setRecommendDermatologist(false);

  } catch (error) {

  console.error("Full Error:", error);

  if (error.response) {

    console.log("Status:", error.response.status);
    console.log("Data:", error.response.data);

    alert(JSON.stringify(error.response.data, null, 2));

  } else {

    alert(error.message);

  }

}

};

  useEffect(() => {

    getPatientMonitoringDetails(userId)
      .then((data) => {
        setPatient(data);
      })
      .catch((error) => {
        console.error(error);
        alert("Failed to load patient.");
      })
      .finally(() => {
        setLoading(false);
      });

  }, [userId]);

  if (loading) {

    return (

      <ConsultantLayout>

        <div className="text-center py-20">
          Loading...
        </div>

      </ConsultantLayout>

    );

  }

  if (!patient) {

    return (

      <ConsultantLayout>

        <div className="text-center py-20">
          Patient not found.
        </div>

      </ConsultantLayout>

    );

  }

  return (

    <ConsultantLayout>

     <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 p-10 mb-10 shadow-xl">

  <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10"></div>

  <div className="flex justify-between items-center">

    <div>

      <p className="text-cyan-100 text-lg">
        Patient Monitoring
      </p>

      <h1 className="text-5xl font-bold text-white mt-2">
        {patient.patient.full_name}
      </h1>

      <p className="text-cyan-100 mt-4 text-lg">
        Monitor patient's progress and provide skincare recommendations.
      </p>

    </div>

    <div className="hidden lg:flex">

      <div className="w-32 h-32 rounded-full bg-white/15 flex items-center justify-center text-6xl">

        👤

      </div>

    </div>

  </div>

</div>

<div className="grid md:grid-cols-4 gap-6 mb-10">

  <div className="bg-white rounded-3xl shadow-xl p-6">

    <p className="text-gray-500">
      Overall Score
    </p>

    <h2 className="text-5xl font-bold text-blue-700 mt-3">
      {patient.assessment?.overall_score}
    </h2>

  </div>

  <div className="bg-white rounded-3xl shadow-xl p-6">

    <p className="text-gray-500">
      Skin Type
    </p>

    <h2 className="text-3xl font-bold text-green-700 mt-4">
      {patient.skin_profile?.skin_type}
    </h2>

  </div>

  <div className="bg-white rounded-3xl shadow-xl p-6">

    <p className="text-gray-500">
      Stress Level
    </p>

    <h2 className="text-3xl font-bold text-yellow-600 mt-4">
      {patient.lifestyle?.stress_level}
    </h2>

  </div>

  <div className="bg-white rounded-3xl shadow-xl p-6">

    <p className="text-gray-500">
      Water Intake
    </p>

    <h2 className="text-3xl font-bold text-cyan-700 mt-4">
      {patient.lifestyle?.water_intake} L
    </h2>

  </div>

</div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">

  {/* Patient Information */}

  <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">

    <div className="flex items-center gap-4 mb-8">

      <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-3xl">

        👤

      </div>

      <div>

        <h2 className="text-2xl font-bold">
          Patient Information
        </h2>

        <p className="text-gray-500">
          Personal details
        </p>

      </div>

    </div>

    <div className="space-y-5">

      <div className="flex justify-between border-b pb-3">

        <span className="text-gray-500">Name</span>

        <span className="font-semibold">
          {patient.patient.full_name}
        </span>

      </div>

      <div className="flex justify-between border-b pb-3">

        <span className="text-gray-500">Email</span>

        <span className="font-semibold">
          {patient.patient.email}
        </span>

      </div>

      <div className="flex justify-between border-b pb-3">

        <span className="text-gray-500">Age</span>

        <span className="font-semibold">
          {patient.patient.age}
        </span>

      </div>

      <div className="flex justify-between">

        <span className="text-gray-500">Gender</span>

        <span className="font-semibold">
          {patient.patient.gender}
        </span>

      </div>

    </div>

  </div>

  {/* Skin Profile */}

  <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">

    <div className="flex items-center gap-4 mb-8">

      <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center text-3xl">

        🧴

      </div>

      <div>

        <h2 className="text-2xl font-bold">
          Skin Profile
        </h2>

        <p className="text-gray-500">
          Skin characteristics
        </p>

      </div>

    </div>

    <div className="space-y-5">

      <div className="flex justify-between border-b pb-3">

        <span className="text-gray-500">
          Skin Type
        </span>

        <span className="font-semibold">
          {patient.skin_profile?.skin_type}
        </span>

      </div>

      <div className="flex justify-between border-b pb-3">

        <span className="text-gray-500">
          Sensitivity
        </span>

        <span className="font-semibold">
          {patient.skin_profile?.sensitivity}
        </span>

      </div>

      <div className="flex justify-between">

        <span className="text-gray-500">
          Allergies
        </span>

        <span className="font-semibold text-right">
          {patient.skin_profile?.allergies || "None"}
        </span>

      </div>

    </div>

  </div>

</div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">

  {/* Lifestyle */}

  <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">

    <div className="flex items-center gap-4 mb-8">

      <div className="w-14 h-14 rounded-2xl bg-yellow-100 flex items-center justify-center text-3xl">
        🌿
      </div>

      <div>

        <h2 className="text-2xl font-bold">
          Lifestyle Analysis
        </h2>

        <p className="text-gray-500">
          Daily habits affecting skin health
        </p>

      </div>

    </div>

    <div className="space-y-5">

      <div className="flex justify-between border-b pb-3">

        <span className="text-gray-500">
          Sleep Duration
        </span>

        <span className="font-semibold">
          {patient.lifestyle?.sleep_duration} Hours
        </span>

      </div>

      <div className="flex justify-between border-b pb-3">

        <span className="text-gray-500">
          Water Intake
        </span>

        <span className="font-semibold">
          {patient.lifestyle?.water_intake} Litres
        </span>

      </div>

      <div className="flex justify-between border-b pb-3">

        <span className="text-gray-500">
          Exercise
        </span>

        <span className="font-semibold">
          {patient.lifestyle?.exercise_habits}
        </span>

      </div>

      <div className="flex justify-between">

        <span className="text-gray-500">
          Stress Level
        </span>

        <span className="font-semibold">
          {patient.lifestyle?.stress_level}
        </span>

      </div>

    </div>

  </div>

  {/* AI Assessment */}

  <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">

    <div className="flex items-center gap-4 mb-8">

      <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center text-3xl">
        🤖
      </div>

      <div>

        <h2 className="text-2xl font-bold">
          AI Skin Assessment
        </h2>

        <p className="text-gray-500">
          Latest skin analysis report
        </p>

      </div>

    </div>

    <div className="grid grid-cols-2 gap-5">

      <div className="bg-blue-50 rounded-2xl p-5 text-center">

        <p className="text-gray-500 text-sm">
          Overall
        </p>

        <h3 className="text-3xl font-bold text-blue-700 mt-2">
          {patient.assessment?.overall_score}
        </h3>

      </div>

      <div className="bg-red-50 rounded-2xl p-5 text-center">

        <p className="text-gray-500 text-sm">
          Acne
        </p>

        <h3 className="text-3xl font-bold text-red-600 mt-2">
          {patient.assessment?.acne_score}
        </h3>

      </div>

      <div className="bg-yellow-50 rounded-2xl p-5 text-center">

        <p className="text-gray-500 text-sm">
          Pigmentation
        </p>

        <h3 className="text-3xl font-bold text-yellow-600 mt-2">
          {patient.assessment?.pigmentation_score}
        </h3>

      </div>

      <div className="bg-pink-50 rounded-2xl p-5 text-center">

        <p className="text-gray-500 text-sm">
          Redness
        </p>

        <h3 className="text-3xl font-bold text-pink-600 mt-2">
          {patient.assessment?.redness_score}
        </h3>

      </div>

      <div className="bg-indigo-50 rounded-2xl p-5 text-center col-span-2">

        <p className="text-gray-500 text-sm">
          Wrinkles
        </p>

        <h3 className="text-3xl font-bold text-indigo-700 mt-2">
          {patient.assessment?.wrinkles_score}
        </h3>

      </div>

    </div>

  </div>

</div>

      <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">

<h2 className="text-2xl font-bold mb-8">

Progress Timeline

</h2>

<div className="space-y-5">

<div className="flex gap-5">

<div className="w-4 h-4 rounded-full bg-green-500 mt-2"></div>

<div>

<h3 className="font-bold">

Latest Assessment Completed

</h3>

<p className="text-gray-500">

Overall Score: {patient.assessment?.overall_score}

</p>

</div>

</div>

<div className="flex gap-5">

<div className="w-4 h-4 rounded-full bg-blue-500 mt-2"></div>

<div>

<h3 className="font-bold">

Lifestyle Updated

</h3>

<p className="text-gray-500">

Patient information synchronized.

</p>

</div>

</div>

</div>

</div>

     <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-8">

  <div className="flex items-center gap-4 mb-8">

    <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center text-3xl">
      💡
    </div>

    <div>

      <h2 className="text-2xl font-bold">
        Consultant Recommendation
      </h2>

      <p className="text-gray-500">
        Submit your professional opinion for this patient.
      </p>

    </div>

  </div>

  <label className="block font-semibold mb-3">
    Recommendation Notes
  </label>

  <textarea
    rows="7"
    value={recommendation}
    onChange={(e) => setRecommendation(e.target.value)}
    className="w-full border border-gray-300 rounded-2xl p-5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
    placeholder="Write detailed skincare recommendations, precautions, medications or lifestyle improvements..."
  />

  <div className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-6">

    <label className="flex items-center gap-4">

      <input
        type="checkbox"
        checked={recommendDermatologist}
        onChange={(e) =>
          setRecommendDermatologist(e.target.checked)
        }
        className="w-5 h-5"
      />

      <div>

        <h3 className="font-bold text-lg">
          Recommend Dermatologist
        </h3>

        <p className="text-gray-500 text-sm">
          Enable this if the patient requires specialist treatment.
        </p>

      </div>

    </label>

  </div>

  <div className="flex justify-end mt-8">

    <button
      onClick={handleRecommendation}
      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg transition"
    >
      📤 Send Recommendation
    </button>

  </div>

</div>

    </ConsultantLayout>

  );

}

export default ConsultantMonitoringDetails;