import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  FaUserCircle,
  FaEnvelope,
  FaCalendarAlt,
  FaArrowRight,
  FaSearch,
} from "react-icons/fa";

import DermatologistLayout from "../layouts/DermatologistLayout";
import { getDermatologistPatients } from "../services/dermatologistService";

function DermatologistPatients() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        setLoading(true);

        const data = await getDermatologistPatients();

        setPatients(data);
      } catch (error) {
        console.error(error);
        alert("Failed to load patients.");
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, []);

  // Search filter (Derived value - no useEffect needed)
  const filteredPatients = patients.filter((patient) =>
    patient.patient_name
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <DermatologistLayout>

      {/* Header */}

      <div className="mb-8">

        <h1 className="text-4xl font-bold text-gray-800">
          Patient Records
        </h1>

        <p className="text-gray-500 mt-2">
          Review and manage dermatologist patient records.
        </p>

      </div>

      {/* Search */}

      <div className="relative mb-8">

        <FaSearch className="absolute left-4 top-4 text-gray-400" />

        <input
          type="text"
          placeholder="Search patient..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 outline-none"
        />

      </div>

      {loading ? (

        <div className="text-center py-20 text-lg font-semibold">
          Loading Patients...
        </div>

      ) : filteredPatients.length === 0 ? (

        <div className="bg-white rounded-2xl shadow-lg py-20 text-center">

          <h2 className="text-2xl font-bold text-gray-700">
            No Patients Found
          </h2>

          <p className="text-gray-500 mt-2">
            No matching patients available.
          </p>

        </div>

      ) : (

        <div className="grid lg:grid-cols-2 gap-8">

          {filteredPatients.map((patient) => (

            <div
              key={patient.appointment_id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 p-7"
            >

              {/* Patient Header */}

              <div className="flex justify-between items-start">

                <div className="flex items-center gap-4">

                  <div className="bg-teal-100 p-4 rounded-full">

                    <FaUserCircle className="text-4xl text-teal-700" />

                  </div>

                  <div>

                    <h2 className="text-2xl font-bold">
                      {patient.patient_name}
                    </h2>

                    <div className="flex items-center gap-2 text-gray-500 mt-1">

                      <FaEnvelope />

                      {patient.email}

                    </div>

                  </div>

                </div>

                {patient.status === "COMPLETED" ? (

                  <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                    Completed
                  </span>

                ) : (

                  <span className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full text-sm font-semibold">
                    Pending
                  </span>

                )}

              </div>

              {/* Appointment */}

              <div className="mt-6 flex items-center gap-3">

                <FaCalendarAlt className="text-teal-600" />

                <span>

                  <strong>Appointment:</strong>{" "}

                  {new Date(patient.appointment_date).toLocaleDateString()}

                </span>

              </div>

              {/* Status Box */}

              <div className="mt-6 bg-gray-50 rounded-xl p-4">

                <h3 className="font-semibold mb-2">
                  Treatment Status
                </h3>

                <p className="text-gray-700">

                  {patient.status === "COMPLETED"
                    ? "Treatment has been completed successfully."
                    : "Awaiting dermatologist review and treatment."}

                </p>

              </div>

              {/* Button */}

              <Link
                to={`/dermatologist/patient/${patient.appointment_id}`}
                className="mt-8 flex justify-center items-center gap-3 bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white py-3 rounded-xl font-semibold transition-all"
              >

                View Record

                <FaArrowRight />

              </Link>

            </div>

          ))}

        </div>

      )}

    </DermatologistLayout>
  );
}

export default DermatologistPatients;