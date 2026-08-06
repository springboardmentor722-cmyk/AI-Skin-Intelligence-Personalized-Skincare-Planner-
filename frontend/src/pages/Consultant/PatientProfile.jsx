import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";

function PatientProfile() {
  const { id } = useParams();

  const [patient, setPatient] = useState(null);
  const [recommendation, setRecommendation] = useState("");

  useEffect(() => {
    fetchPatient();
  }, []);

  const fetchPatient = async () => {
    try {
      const res = await api.get(`/consultant/patient/${id}`);
      setPatient(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const saveRecommendation = async () => {
    try {
      await api.post("/consultant/recommendation", {
        patient_id: id,
        recommendation,
      });

      alert("Recommendation Saved Successfully!");
    } catch (err) {
      console.log(err);
      alert("Failed to save recommendation.");
    }
  };

  if (!patient) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">

      <h1 className="text-4xl font-bold text-green-700 mb-8">
        Patient Profile
      </h1>

      {/* Personal Details */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-2xl font-bold text-blue-600 mb-4">
          Personal Details
        </h2>

        <p><strong>Name:</strong> {patient.full_name}</p>
        <p><strong>Age:</strong> {patient.age}</p>
        <p><strong>Gender:</strong> {patient.gender}</p>
      </div>

      {/* Skin Details */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-2xl font-bold text-green-600 mb-4">
          Skin Details
        </h2>

        <p><strong>Skin Type:</strong> {patient.skin_type}</p>
        <p><strong>Skin Tone:</strong> {patient.skin_tone}</p>
        <p><strong>Concerns:</strong> {patient.concerns}</p>
        <p><strong>Allergies:</strong> {patient.allergies}</p>
      </div>

      {/* Lifestyle */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-2xl font-bold text-purple-600 mb-4">
          Lifestyle
        </h2>

        <p><strong>Sleep:</strong> {patient.sleep_hours} Hours</p>
        <p><strong>Water Intake:</strong> {patient.water_intake} L</p>
        <p><strong>Exercise:</strong> {patient.exercise}</p>
        <p><strong>Stress:</strong> {patient.stress_level}</p>
        <p><strong>Outdoor Exposure:</strong> {patient.outdoor_exposure}</p>
      </div>

      {/* Recommendation */}
      <div className="bg-white rounded-xl shadow p-6">

        <h2 className="text-2xl font-bold text-orange-600 mb-4">
          Consultant Recommendation
        </h2>

        <textarea
          rows="6"
          value={recommendation}
          onChange={(e) => setRecommendation(e.target.value)}
          placeholder="Write recommendation..."
          className="w-full border rounded-lg p-4"
        />

        <button
          onClick={saveRecommendation}
          className="mt-4 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
        >
          Save Recommendation
        </button>

      </div>

    </div>
  );
}

export default PatientProfile;