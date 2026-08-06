import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaCalendarAlt,
  FaEnvelope,
  FaUserCircle,
  FaStethoscope,
  FaArrowRight,
} from "react-icons/fa";

import DermatologistLayout from "../layouts/DermatologistLayout";
import { getDermatologistAppointments } from "../services/dermatologistService";

function DermatologistAppointments() {

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {

    getDermatologistAppointments()
      .then((data) => setAppointments(data))
      .catch((error) => {
        console.error(error);
        alert("Failed to load appointments.");
      })
      .finally(() => setLoading(false));

  }, []);

  if (loading) {

    return (
      <DermatologistLayout>

        <div className="text-center py-24 text-lg font-semibold">
          Loading Appointments...
        </div>

      </DermatologistLayout>
    );

  }

  return (

    <DermatologistLayout>

      {/* Header */}

      <div className="mb-10">

        <h1 className="text-4xl font-bold text-gray-800">

          Dermatologist Appointments

        </h1>

        <p className="text-gray-500 mt-2">

          Patients referred by consultants for specialist review.

        </p>

      </div>

      {/* Summary */}

      <div className="bg-gradient-to-r from-teal-600 to-cyan-700 rounded-2xl text-white p-6 mb-8 shadow-lg">

        <h2 className="text-2xl font-bold">

          {appointments.length} Patients Awaiting Review

        </h2>

        <p className="mt-2 text-teal-100">

          Review consultant recommendations and prepare treatment plans.

        </p>

      </div>

      {appointments.length === 0 ? (

        <div className="bg-white rounded-2xl shadow-lg py-20 text-center">

          <h2 className="text-2xl font-bold text-gray-700">

            No Patients Waiting

          </h2>

          <p className="text-gray-500 mt-2">

            New referrals from consultants will appear here.

          </p>

        </div>

      ) : (

        <div className="grid lg:grid-cols-2 gap-8">

          {appointments.map((item) => (

            <div
              key={item.appointment_id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-7 border border-gray-100"
            >

              {/* Patient */}

              <div className="flex justify-between items-start">

                <div className="flex items-center gap-4">

                  <div className="bg-teal-100 p-4 rounded-full">

                    <FaUserCircle className="text-4xl text-teal-700" />

                  </div>

                  <div>

                    <h2 className="text-2xl font-bold">

                      {item.patient_name}

                    </h2>

                    <div className="flex items-center gap-2 text-gray-500 mt-1">

                      <FaEnvelope />

                      {item.email}

                    </div>

                  </div>

                </div>

                <span className="bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-semibold">

                  Awaiting Review

                </span>

              </div>

              {/* Appointment */}

              <div className="mt-6 flex items-center gap-3">

                <FaCalendarAlt className="text-teal-600" />

                <span>

                  <strong>Appointment:</strong>{" "}
                  {new Date(item.appointment_date).toLocaleString()}

                </span>

              </div>

              {/* Recommendation */}

              <div className="mt-6 bg-cyan-50 border-l-4 border-cyan-600 rounded-xl p-5">

                <div className="flex items-center gap-2 mb-3">

                  <FaStethoscope className="text-cyan-700" />

                  <h3 className="font-bold">

                    Consultant Recommendation

                  </h3>

                </div>

                <p className="text-gray-700 leading-relaxed">

                  {item.consultant_recommendation}

                </p>

              </div>

              {/* Button */}

              <button

                onClick={() =>
                  navigate(`/dermatologist/patient/${item.appointment_id}`)
                }

                className="mt-8 w-full bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white py-3 rounded-xl flex justify-center items-center gap-3 font-semibold transition-all"

              >

                Review Case

                <FaArrowRight />

              </button>

            </div>

          ))}

        </div>

      )}

    </DermatologistLayout>

  );

}

export default DermatologistAppointments;