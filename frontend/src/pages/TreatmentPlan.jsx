import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { getTreatment } from "../services/treatmentService";

function TreatmentPlan() {

  const [treatment, setTreatment] = useState(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {

    const fetchTreatment = async () => {

      try {

        setLoading(true);

        const data = await getTreatment();

        setTreatment(data);

      } catch (error) {

        console.error(error);

        alert("No treatment plan available.");

      } finally {

        setLoading(false);

      }

    };

    fetchTreatment();

  }, []);

  return (

    <DashboardLayout>

      <h1 className="text-3xl font-bold mb-8">
        My Treatment Plan
      </h1>

      {loading ? (

        <div className="text-center py-20 text-xl font-semibold">
          Loading Treatment...
        </div>

      ) : !treatment ? (

        <div className="text-center py-20">

          <h2 className="text-2xl font-bold text-red-600">
            No Treatment Plan Available
          </h2>

          <p className="text-gray-500 mt-3">
            Your dermatologist has not uploaded a treatment plan yet.
          </p>

        </div>

      ) : (

        <div className="space-y-6">

          <div className="bg-white shadow rounded-xl p-6">

            <h2 className="text-xl font-bold mb-3">
              Diagnosis
            </h2>

            <p>{treatment.diagnosis}</p>

          </div>

          <div className="bg-white shadow rounded-xl p-6">

            <h2 className="text-xl font-bold mb-3">
              Medicines
            </h2>

            <p className="whitespace-pre-line">
              {treatment.medicines}
            </p>

          </div>

          <div className="grid md:grid-cols-2 gap-6">

            <div className="bg-white shadow rounded-xl p-6">

              <h2 className="text-xl font-bold mb-3">
                🌞 Morning Routine
              </h2>

              <p className="whitespace-pre-line">
                {treatment.morning_routine}
              </p>

            </div>

            <div className="bg-white shadow rounded-xl p-6">

              <h2 className="text-xl font-bold mb-3">
                🌙 Night Routine
              </h2>

              <p className="whitespace-pre-line">
                {treatment.night_routine}
              </p>

            </div>

          </div>

          <div className="bg-white shadow rounded-xl p-6">

            <h2 className="text-xl font-bold mb-3">
              ❤️ Lifestyle Advice
            </h2>

            <p className="whitespace-pre-line">
              {treatment.lifestyle_advice}
            </p>

          </div>

          <div className="bg-green-50 border-l-4 border-green-600 rounded-xl p-6">

            <h2 className="text-xl font-bold mb-3">
              📅 Follow-up Appointment
            </h2>

            <p className="text-lg font-semibold">

              {new Date(
                treatment.follow_up_date
              ).toLocaleDateString()}

            </p>

          </div>

        </div>

      )}

    </DashboardLayout>

  );

}

export default TreatmentPlan;