import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import ConsultantLayout from "../layouts/ConsultantLayout";
import { getMonitoredPatients } from "../services/consultantMonitoringService";

import {
  FaUsers,
  FaSearch,
  FaEye,
  FaFilter,
} from "react-icons/fa";
function ConsultantMonitoring() {

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
const [riskFilter, setRiskFilter] = useState("ALL");

  const navigate = useNavigate();

  useEffect(() => {

    getMonitoredPatients()
      .then((data) => {
        setPatients(data);
      })
      .catch((error) => {
        console.error(error);
        alert("Failed to load patients.");
      })
      .finally(() => {
        setLoading(false);
      });

  }, []);

  const getBadge = (risk) => {

    switch (risk) {

      case "LOW":
        return "bg-green-500";

      case "MODERATE":
        return "bg-yellow-500";

      case "HIGH":
        return "bg-orange-500";

      case "SEVERE":
        return "bg-red-600";

      default:
        return "bg-gray-500";

    }

  };

  const filteredPatients = patients.filter((patient) => {

  const searchMatch =
    patient.name
      ?.toLowerCase()
      .includes(search.toLowerCase()) ||
    patient.email
      ?.toLowerCase()
      .includes(search.toLowerCase());

  const riskMatch =
    riskFilter === "ALL"
      ? true
      : patient.risk === riskFilter;

  return searchMatch && riskMatch;

});

  return (

    <ConsultantLayout>

      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-500 p-10 mb-10 shadow-xl">

  <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10"></div>

  <div className="flex justify-between items-center">

    <div>

      <p className="text-green-100 text-lg">
        Consultant Workspace
      </p>

      <h1 className="text-5xl font-bold text-white mt-2">
        Patient Monitoring
      </h1>

      <p className="text-green-100 mt-4 text-lg">
        Track patient progress and monitor AI skin health reports.
      </p>

    </div>

    <div className="hidden lg:flex">

      <div className="w-32 h-32 rounded-full bg-white/15 flex items-center justify-center text-6xl">

        <FaUsers className="text-white text-6xl" />

      </div>

    </div>

  </div>

</div>

<div className="grid md:grid-cols-3 gap-6 mb-10">

  <div className="bg-white rounded-3xl shadow-xl p-8">

    <p className="text-gray-500">
      Total Patients
    </p>

    <h2 className="text-5xl font-bold text-blue-700 mt-3">
      {patients.length}
    </h2>

  </div>

  <div className="bg-white rounded-3xl shadow-xl p-8">

    <p className="text-gray-500">
      High Risk Patients
    </p>

    <h2 className="text-5xl font-bold text-red-600 mt-3">

      {patients.filter(p => p.risk === "HIGH" || p.risk === "SEVERE").length}

    </h2>

  </div>

  <div className="bg-white rounded-3xl shadow-xl p-8">

    <p className="text-gray-500">
      Low Risk Patients
    </p>

    <h2 className="text-5xl font-bold text-green-600 mt-3">

      {patients.filter(p => p.risk === "LOW").length}

    </h2>

  </div>

</div>



      {loading ? (

        <div className="bg-white rounded-3xl shadow-xl p-20 text-center">

<div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>

<h2 className="text-2xl font-bold mt-6">

Loading Patients...

</h2>

<p className="text-gray-500 mt-3">

Please wait while patient records are loading.

</p>

</div>

      ) : patients.length === 0 ? (

        <div className="text-center py-20">

          <div className="bg-white rounded-3xl shadow-xl p-20 text-center">

<FaUsers className="text-6xl text-blue-400 mx-auto"/>

<h2 className="text-3xl font-bold mt-6">

No Patients Found

</h2>

<p className="text-gray-500 mt-4">

No monitored patients are available at the moment.

</p>

</div>

        </div>

      ) : (

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">

  {/* Header */}

  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 p-8 border-b">

    <div>

      <h2 className="text-2xl font-bold">
        Patient Records
      </h2>

      <p className="text-gray-500 mt-2">
        View and monitor every assigned patient.
      </p>

    </div>

    <div className="flex gap-4">

      {/* Search */}

      <div className="relative">

        <FaSearch className="absolute left-4 top-4 text-gray-400"/>

        <input
          type="text"
          placeholder="Search patient..."
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
          className="pl-11 pr-4 py-3 border rounded-xl w-72 focus:ring-2 focus:ring-blue-500 outline-none"
        />

      </div>

      {/* Filter */}

      <div className="relative">

        <FaFilter className="absolute left-4 top-4 text-gray-400"/>

        <select
          value={riskFilter}
          onChange={(e)=>setRiskFilter(e.target.value)}
          className="pl-11 pr-10 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
        >

          <option value="ALL">All Risk</option>

          <option value="LOW">LOW</option>

          <option value="MODERATE">MODERATE</option>

          <option value="HIGH">HIGH</option>

          <option value="SEVERE">SEVERE</option>

        </select>

      </div>

    </div>

  </div>

  {/* Table */}

  <div className="overflow-x-auto">

    <table className="w-full">

      <thead className="bg-slate-50 sticky top-0">

        <tr>

          <th className="text-left px-6 py-4 font-semibold">
            Patient
          </th>

          <th className="text-left font-semibold">
            Email
          </th>

          <th className="text-center font-semibold">
            AI Score
          </th>

          <th className="text-center font-semibold">
            Risk
          </th>

          <th className="text-center font-semibold">
            Action
          </th>

        </tr>

      </thead>

      <tbody>

        {filteredPatients.map((patient)=>(

          <tr
            key={patient.user_id}
            className="border-t hover:bg-blue-50 transition"
          >

            {/* Patient */}

            <td className="px-6 py-5">

              <div className="flex items-center gap-4">

                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-lg">

                  {patient.name?.charAt(0)}

                </div>

                <div>

                  <h3 className="font-semibold">

                    {patient.name}

                  </h3>

                  <p className="text-sm text-gray-500">

                    Patient #{patient.user_id}

                  </p>

                </div>

              </div>

            </td>

            {/* Email */}

            <td className="text-gray-600">

              {patient.email}

            </td>

            {/* Score */}

            <td className="text-center">

              <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-bold">

                {patient.overall_score}

              </span>

            </td>

            {/* Risk */}

            <td className="text-center">

              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold text-white ${getBadge(patient.risk)}`}
              >

                {patient.risk}

              </span>

            </td>

            {/* Button */}

            <td className="text-center">

              <button

                onClick={() =>
                  navigate(`/consultant/monitoring/${patient.user_id}`)
                }

                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl flex items-center gap-2 mx-auto transition"

              >

                <FaEye/>

                View Progress

              </button>

            </td>

          </tr>

        ))}

      </tbody>

    </table>

  </div>

</div>
          

        

      )}

    </ConsultantLayout>

  );

}

export default ConsultantMonitoring;