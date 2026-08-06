import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import DermatologistLayout from "../layouts/DermatologistLayout";

import {
  FaUserCircle,
  FaEnvelope,
  
  FaCheckCircle,
} from "react-icons/fa";

import {
  getDermatologistPatient,
  saveTreatment,
} from "../services/dermatologistService";

function DermatologistPatientDetails() {

  const { appointmentId } = useParams();

  const [patient, setPatient] = useState(null);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [treatment, setTreatment] = useState({
    diagnosis: "",
    medicines: "",
    morning_routine: "",
    night_routine: "",
    lifestyle_advice: "",
    follow_up_date: "",
  });
 

  useEffect(() => {

  const loadPatient = async () => {

    try {

      const data = await getDermatologistPatient(appointmentId);

      setPatient(data);

    } catch (error) {

      console.error(error);

      alert("Failed to load patient.");

    } finally {

      setLoading(false);

    }

  };

  loadPatient();

}, [appointmentId]);

  const handleSave = async () => {

  try {

    setSaving(true);

    await saveTreatment(
      appointmentId,
      treatment
    );

    alert("Treatment saved successfully.");

    const updated = await getDermatologistPatient(appointmentId);

    setPatient(updated);

  } catch (error) {

    console.error(error);

    alert("Failed to save treatment.");

  } finally {

    setSaving(false);

  }

};
const completedTreatment = patient?.treatment;

  return (

    <DermatologistLayout>

      {loading ? (

        <div className="text-center text-2xl font-bold py-20">

          Loading Patient...

        </div>

      ) : !patient ? (

        <div className="text-center text-red-600 py-20">

          Failed to load patient details.

        </div>

      ) : (

        <>

              {/* ================= Patient Information ================= */}

      {/* ================= Patient Header ================= */}

<div className="bg-gradient-to-r from-teal-600 to-cyan-700 rounded-3xl shadow-xl p-8 mb-8 text-white">

  <div className="flex flex-col md:flex-row justify-between items-center">

    <div className="flex items-center gap-6">

      <div className="bg-white/20 p-5 rounded-full">

        <FaUserCircle className="text-7xl" />

      </div>

      <div>

        <h1 className="text-4xl font-bold">

          {patient?.patient?.full_name}

        </h1>

        <div className="mt-3 flex items-center gap-3 text-lg">

          <FaEnvelope />

          {patient?.patient?.email}

        </div>

      </div>

    </div>

    <div className="mt-6 md:mt-0">

      {completedTreatment ? (

        <span className="bg-green-500 px-6 py-3 rounded-full font-semibold flex items-center gap-2">

          <FaCheckCircle />

          Treatment Completed

        </span>

      ) : (

        <span className="bg-yellow-400 text-black px-6 py-3 rounded-full font-semibold">

          Pending Treatment

        </span>

      )}

    </div>

  </div>

  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10">

    <div className="bg-white/10 rounded-2xl p-5">

      <p className="text-sm opacity-80">

        Age

      </p>

      <h2 className="text-3xl font-bold">

        {patient?.patient?.age}

      </h2>

    </div>

    <div className="bg-white/10 rounded-2xl p-5">

      <p className="text-sm opacity-80">

        Gender

      </p>

      <h2 className="text-3xl font-bold">

        {patient?.patient?.gender}

      </h2>

    </div>

    <div className="bg-white/10 rounded-2xl p-5">

      <p className="text-sm opacity-80">

        Skin Type

      </p>

      <h2 className="text-2xl font-bold">

        {patient?.skin_profile?.skin_type}

      </h2>

    </div>

    <div className="bg-white/10 rounded-2xl p-5">

      <p className="text-sm opacity-80">

        Overall Score

      </p>

      <h2 className="text-3xl font-bold">

        {patient?.assessment?.overall_score}

      </h2>

    </div>

  </div>

</div>

{/* ================= Patient Journey ================= */}

<div className="bg-white rounded-3xl shadow-xl p-8 mb-8">

  <h2 className="text-3xl font-bold text-gray-800 mb-8">
    Patient Journey
  </h2>

  <div className="flex flex-col lg:flex-row items-center justify-between gap-8">

    {/* Appointment */}

    <div className="flex flex-col items-center">

      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-3xl">
        📅
      </div>

      <h3 className="mt-3 font-semibold">
        Appointment
      </h3>

      <p className="text-gray-500 text-sm">
        Booked
      </p>

    </div>

    <div className="hidden lg:block flex-1 h-1 bg-blue-200"></div>

    {/* Consultant */}

    <div className="flex flex-col items-center">

      <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center text-3xl">
        👨‍⚕️
      </div>

      <h3 className="mt-3 font-semibold">
        Consultant
      </h3>

      <p className="text-gray-500 text-sm">
        Reviewed
      </p>

    </div>

    <div className="hidden lg:block flex-1 h-1 bg-yellow-200"></div>

    {/* Referral */}

    <div className="flex flex-col items-center">

      <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-3xl">
        📋
      </div>

      <h3 className="mt-3 font-semibold">
        Referral
      </h3>

      <p className="text-gray-500 text-sm">
        Dermatologist
      </p>

    </div>

    <div className="hidden lg:block flex-1 h-1 bg-green-200"></div>

    {/* Treatment */}

    <div className="flex flex-col items-center">

      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${
          completedTreatment
            ? "bg-green-100"
            : "bg-gray-200"
        }`}
      >
        💊
      </div>

      <h3 className="mt-3 font-semibold">
        Treatment
      </h3>

      <p
        className={`text-sm ${
          completedTreatment
            ? "text-green-600 font-semibold"
            : "text-gray-500"
        }`}
      >
        {completedTreatment ? "Completed" : "Pending"}
      </p>

    </div>

  </div>

</div>

      {/* ================= Skin Profile ================= */}

      {/* ================= Skin Profile ================= */}

<div className="bg-white rounded-3xl shadow-xl p-8 mb-8">

  <h2 className="text-3xl font-bold text-gray-800 mb-8">
    Skin Profile
  </h2>

  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

    <div className="bg-cyan-50 rounded-2xl p-6 border border-cyan-100">

      <h3 className="text-gray-500 text-sm font-semibold uppercase">
        Skin Type
      </h3>

      <p className="text-2xl font-bold text-cyan-700 mt-3">
        {patient?.skin_profile?.skin_type || "N/A"}
      </p>

    </div>

    <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100">

      <h3 className="text-gray-500 text-sm font-semibold uppercase">
        Sensitivity
      </h3>

      <p className="text-2xl font-bold text-orange-600 mt-3">
        {patient?.skin_profile?.sensitivity || "N/A"}
      </p>

    </div>

    <div className="bg-red-50 rounded-2xl p-6 border border-red-100">

      <h3 className="text-gray-500 text-sm font-semibold uppercase">
        Allergies
      </h3>

      <p className="text-lg font-semibold text-red-600 mt-3">
        {patient?.skin_profile?.allergies || "None"}
      </p>

    </div>

    <div className="bg-green-50 rounded-2xl p-6 border border-green-100">

      <h3 className="text-gray-500 text-sm font-semibold uppercase">
        Primary Concern
      </h3>

      <p className="text-xl font-bold text-green-700 mt-3">
        {patient?.skin_profile?.primary_concern || "N/A"}
      </p>

    </div>

  </div>

</div>


      {/* ================= Lifestyle ================= */}

      {/* ================= Lifestyle ================= */}

<div className="bg-white rounded-3xl shadow-xl p-8 mb-8">

  <h2 className="text-3xl font-bold text-gray-800 mb-8">
    Lifestyle Analysis
  </h2>

  <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">

    {/* Sleep */}

    <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 text-center">

      <div className="text-5xl mb-4"></div>

      <h3 className="text-gray-500 text-sm uppercase font-semibold">
        Sleep
      </h3>

      <p className="text-3xl font-bold text-indigo-700 mt-2">
        {patient?.lifestyle?.sleep_duration || 0} hrs
      </p>

    </div>

    {/* Water */}

    <div className="bg-cyan-50 rounded-2xl p-6 border border-cyan-100 text-center">

      <div className="text-5xl mb-4"></div>

      <h3 className="text-gray-500 text-sm uppercase font-semibold">
        Water
      </h3>

      <p className="text-3xl font-bold text-cyan-700 mt-2">
        {patient?.lifestyle?.water_intake || 0} L
      </p>

    </div>

    {/* Exercise */}

    <div className="bg-green-50 rounded-2xl p-6 border border-green-100 text-center">

      <div className="text-5xl mb-4"></div>

      <h3 className="text-gray-500 text-sm uppercase font-semibold">
        Exercise
      </h3>

      <p className="text-lg font-bold text-green-700 mt-2">
        {patient?.lifestyle?.exercise_habits || "N/A"}
      </p>

    </div>

    {/* Stress */}

    <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100 text-center">

      <div className="text-5xl mb-4"></div>

      <h3 className="text-gray-500 text-sm uppercase font-semibold">
        Stress
      </h3>

      <p className="text-lg font-bold text-orange-700 mt-2">
        {patient?.lifestyle?.stress_level || "N/A"}
      </p>

    </div>

    {/* Environment */}

    <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100 text-center">

      <div className="text-5xl mb-4"></div>

      <h3 className="text-gray-500 text-sm uppercase font-semibold">
        Environment
      </h3>

      <p className="text-lg font-bold text-purple-700 mt-2">
        {patient?.lifestyle?.environmental_exposure || "N/A"}
      </p>

    </div>

  </div>

</div>


      {/* ================= AI Assessment ================= */}

      {/* ================= AI Skin Assessment ================= */}

<div className="bg-white rounded-3xl shadow-xl p-8 mb-8">

  <div className="flex items-center justify-between mb-8">

    <div>

      <h2 className="text-3xl font-bold text-gray-800">
        AI Skin Analysis
      </h2>

      <p className="text-gray-500 mt-2">
        Latest AI-generated skin assessment report
      </p>

    </div>

    <div className="bg-gradient-to-r from-cyan-500 to-teal-600 text-white px-6 py-3 rounded-2xl">

      <p className="text-sm">
        Overall Score
      </p>

      <h2 className="text-3xl font-bold">
        {patient?.assessment?.overall_score ?? 0}
      </h2>

    </div>

  </div>

  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

    {/* Acne */}

    <div className="bg-red-50 rounded-2xl p-6 border border-red-100">

      <div className="text-4xl mb-3">
        
      </div>

      <h3 className="text-gray-500 text-sm uppercase font-semibold">
        Acne
      </h3>

      <p className="text-3xl font-bold text-red-600 mt-2">
        {patient?.assessment?.acne_score ?? 0}
      </p>

    </div>

    {/* Pigmentation */}

    <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-100">

      <div className="text-4xl mb-3">
        
      </div>

      <h3 className="text-gray-500 text-sm uppercase font-semibold">
        Pigmentation
      </h3>

      <p className="text-3xl font-bold text-yellow-700 mt-2">
        {patient?.assessment?.pigmentation_score ?? 0}
      </p>

    </div>

    {/* Redness */}

    <div className="bg-pink-50 rounded-2xl p-6 border border-pink-100">

      <div className="text-4xl mb-3">
        
      </div>

      <h3 className="text-gray-500 text-sm uppercase font-semibold">
        Redness
      </h3>

      <p className="text-3xl font-bold text-pink-600 mt-2">
        {patient?.assessment?.redness_score ?? 0}
      </p>

    </div>

    {/* Wrinkles */}

    <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">

      <div className="text-4xl mb-3">
        
      </div>

      <h3 className="text-gray-500 text-sm uppercase font-semibold">
        Wrinkles
      </h3>

      <p className="text-3xl font-bold text-indigo-700 mt-2">
        {patient?.assessment?.wrinkles_score ?? 0}
      </p>

    </div>

  </div>

</div>


      {/* ================= Consultant Recommendation ================= */}

      {/* ================= Consultant Referral ================= */}

<div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-yellow-200 rounded-3xl shadow-xl p-8 mb-8">

  <div className="flex justify-between items-center mb-6">

    <div>

      <h2 className="text-3xl font-bold text-gray-800">
        Consultant Referral
      </h2>

      <p className="text-gray-500 mt-2">
        Latest recommendation received from the consultant.
      </p>

    </div>

    {patient?.recommendation?.recommend_dermatologist ? (

      <span className="bg-green-100 text-green-700 px-5 py-3 rounded-full font-semibold">

        ✓ Referred to Dermatologist

      </span>

    ) : (

      <span className="bg-red-100 text-red-700 px-5 py-3 rounded-full font-semibold">

        ✕ Not Referred

      </span>

    )}

  </div>

  <div className="bg-white rounded-2xl p-6 border border-yellow-100">

    <h3 className="font-semibold text-lg text-gray-700 mb-3">
      Consultant Notes
    </h3>

    <p className="text-gray-700 leading-7">

      {patient?.recommendation?.recommendation || "No recommendation available."}

    </p>

  </div>

</div>

            {/* ================= Dermatologist Treatment ================= */}

      {/* ================= Treatment Plan ================= */}

{completedTreatment ? (

<div className="bg-white rounded-3xl shadow-xl p-8 mb-8">

  <div className="flex justify-between items-center mb-8">

    <div>

      <h2 className="text-3xl font-bold text-gray-800">
        Treatment Report
      </h2>

      <p className="text-gray-500 mt-2">
        This treatment plan has already been completed.
      </p>

    </div>

    <span className="bg-green-100 text-green-700 px-5 py-3 rounded-full font-semibold">
      ✓ Completed
    </span>

  </div>

  <div className="space-y-6">

    <div className="bg-red-50 rounded-2xl p-6">
      <h3 className="font-bold text-red-700 mb-2">
        Diagnosis
      </h3>

      <p>
        {completedTreatment.diagnosis}
      </p>
    </div>

    <div className="bg-blue-50 rounded-2xl p-6">
      <h3 className="font-bold text-blue-700 mb-2">
        Medicines
      </h3>

      <p>
        {completedTreatment.medicines}
      </p>
    </div>

    <div className="grid md:grid-cols-2 gap-6">

      <div className="bg-cyan-50 rounded-2xl p-6">

        <h3 className="font-bold text-cyan-700 mb-2">
          Morning Routine
        </h3>

        <p>
          {completedTreatment.morning_routine}
        </p>

      </div>

      <div className="bg-indigo-50 rounded-2xl p-6">

        <h3 className="font-bold text-indigo-700 mb-2">
          Night Routine
        </h3>

        <p>
          {completedTreatment.night_routine}
        </p>

      </div>

    </div>

    <div className="bg-green-50 rounded-2xl p-6">

      <h3 className="font-bold text-green-700 mb-2">
        Lifestyle Advice
      </h3>

      <p>
        {completedTreatment.lifestyle_advice}
      </p>

    </div>

    <div className="bg-yellow-50 rounded-2xl p-6">

      <h3 className="font-bold text-yellow-700 mb-2">
        Follow-up Date
      </h3>

      <p>
        {completedTreatment.follow_up_date}
      </p>

    </div>

  </div>

</div>

) : (

<div className="bg-white rounded-3xl shadow-xl p-8 mb-8">

  <h2 className="text-3xl font-bold text-gray-800 mb-8">
    Create Treatment Plan
  </h2>

  <div className="space-y-6">

    <div>

      <label className="font-semibold text-gray-700">
        Diagnosis
      </label>

      <textarea
        rows={3}
        value={treatment.diagnosis}
        onChange={(e)=>
          setTreatment({
            ...treatment,
            diagnosis:e.target.value
          })
        }
        className="w-full mt-2 rounded-xl border p-4 focus:ring-2 focus:ring-teal-500 outline-none"
      />

    </div>

    <div>

      <label className="font-semibold text-gray-700">
        Medicines
      </label>

      <textarea
        rows={3}
        value={treatment.medicines}
        onChange={(e)=>
          setTreatment({
            ...treatment,
            medicines:e.target.value
          })
        }
        className="w-full mt-2 rounded-xl border p-4 focus:ring-2 focus:ring-teal-500 outline-none"
      />

    </div>

    <div className="grid md:grid-cols-2 gap-6">

      <div>

        <label className="font-semibold">
          Morning Routine
        </label>

        <textarea
          rows={4}
          value={treatment.morning_routine}
          onChange={(e)=>
            setTreatment({
              ...treatment,
              morning_routine:e.target.value
            })
          }
          className="w-full mt-2 rounded-xl border p-4"
        />

      </div>

      <div>

        <label className="font-semibold">
          Night Routine
        </label>

        <textarea
          rows={4}
          value={treatment.night_routine}
          onChange={(e)=>
            setTreatment({
              ...treatment,
              night_routine:e.target.value
            })
          }
          className="w-full mt-2 rounded-xl border p-4"
        />

      </div>

    </div>

    <div>

      <label className="font-semibold">
        Lifestyle Advice
      </label>

      <textarea
        rows={3}
        value={treatment.lifestyle_advice}
        onChange={(e)=>
          setTreatment({
            ...treatment,
            lifestyle_advice:e.target.value
          })
        }
        className="w-full mt-2 rounded-xl border p-4"
      />

    </div>

    <div>

      <label className="font-semibold">
        Follow-up Date
      </label>

      <input
        type="date"
        value={treatment.follow_up_date}
        onChange={(e)=>
          setTreatment({
            ...treatment,
            follow_up_date:e.target.value
          })
        }
        className="w-full mt-2 rounded-xl border p-4"
      />

    </div>

    <button
      onClick={handleSave}
      disabled={saving}
      className="w-full bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white py-4 rounded-2xl text-lg font-semibold transition-all disabled:opacity-50"
    >

      {saving ? "Saving..." : "Save Treatment Plan"}

    </button>

  </div>

</div>

)}
      </>
      
    )}
    

    </DermatologistLayout>

  );

}

export default DermatologistPatientDetails;