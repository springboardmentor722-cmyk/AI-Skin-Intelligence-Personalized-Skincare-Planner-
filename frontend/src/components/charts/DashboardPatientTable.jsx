import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaArrowRight } from "react-icons/fa";

import { getMonitoredPatients } from "../../services/consultantMonitoringService";

function DashboardPatientTable() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await getMonitoredPatients();
        setPatients(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchPatients();
  }, []);

  const filteredPatients = patients.filter((patient) =>
    patient.name?.toLowerCase().includes(search.toLowerCase())
  );

  const getRiskColor = (risk) => {
    switch (risk) {
      case "LOW":
        return "bg-green-100 text-green-700";

      case "MODERATE":
        return "bg-yellow-100 text-yellow-700";

      case "HIGH":
        return "bg-orange-100 text-orange-700";

      case "SEVERE":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 mt-10">

      <div className="flex justify-between items-center mb-8">

        <div>

          <h2 className="text-2xl font-bold">
            Patient Monitoring
          </h2>

          <p className="text-gray-500 mt-2">
            Monitor every patient currently assigned to you
          </p>

        </div>

        <div className="relative">

          <FaSearch className="absolute left-4 top-4 text-gray-400"/>

          <input
            type="text"
            placeholder="Search patient..."
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            className="pl-12 pr-5 py-3 border rounded-2xl w-80 focus:ring-2 focus:ring-blue-500 outline-none"
          />

        </div>

      </div>

      <div className="overflow-hidden rounded-2xl border">

        <table className="w-full">

          <thead className="bg-gray-50">

            <tr className="text-left">

              <th className="px-6 py-4">Patient</th>

              <th>Overall Score</th>

              <th>Risk Level</th>

              <th>Email</th>

              <th className="text-center">Action</th>

            </tr>

          </thead>

          <tbody>

            {filteredPatients.map((patient) => (

              <tr
                key={patient.user_id}
                className="border-t hover:bg-blue-50 transition"
              >

                <td className="px-6 py-5">

                  <div className="flex items-center gap-4">

                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">

                      {patient.name?.charAt(0)}

                    </div>

                    <div>

                      <p className="font-semibold">

                        {patient.name}

                      </p>

                      <p className="text-sm text-gray-500">

                        Patient ID #{patient.user_id}

                      </p>

                    </div>

                  </div>

                </td>

                <td>

                  <span className="font-bold text-blue-700 text-lg">

                    {patient.overall_score}

                  </span>

                </td>

                <td>

                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${getRiskColor(patient.risk)}`}
                  >

                    {patient.risk}

                  </span>

                </td>

                <td className="text-gray-600">

                  {patient.email}

                </td>

                <td className="text-center">

                  <button
                    onClick={() =>
                      navigate(`/consultant/monitoring/${patient.user_id}`)
                    }
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl flex items-center gap-2 mx-auto transition"
                  >

                    View

                    <FaArrowRight/>

                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default DashboardPatientTable;