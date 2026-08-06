import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import ConsultantLayout from "../layouts/ConsultantLayout";
import { getPendingAppointments } from "../services/consultantService";
import {
  FaClipboardList,
  FaUser,
} from "react-icons/fa";

function ConsultantAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPendingAppointments()
      .then((data) => {
        setAppointments(data);
      })
      .catch((error) => {
        console.error(error);
        alert("Failed to load appointments.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <ConsultantLayout>
      <div className="mb-10">

  <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-blue-700 via-cyan-600 to-teal-500 p-10 mb-10 shadow-xl">

  <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10"></div>

  <div className="flex justify-between items-center">

    <div>

      <p className="text-blue-100 text-lg">
        Consultant Workspace
      </p>

      <h1 className="text-5xl font-bold text-white mt-2">
        Appointment Requests
      </h1>

      <p className="text-blue-100 mt-5 text-lg max-w-2xl">
        Review consultation requests submitted by patients and begin their AI skin assessment process.
      </p>

    </div>

    <div className="hidden lg:flex">

      <div className="w-32 h-32 rounded-full bg-white/15 flex items-center justify-center">

        <FaClipboardList className="text-white text-6xl"/>

      </div>

    </div>

  </div>

</div>
</div>

      {loading ? (

  <div className="text-center py-20 text-xl font-semibold">
    Loading Appointment Requests...
  </div>

) : appointments.length === 0 ? (

  <div className="bg-white rounded-3xl shadow-xl p-16 text-center">

    <div className="text-6xl mb-5">
      📋
    </div>

    <h2 className="text-3xl font-bold text-gray-700">
      No Pending Appointments
    </h2>

    <p className="text-gray-500 mt-3">
      There are no appointment requests waiting for review.
    </p>

  </div>

) : (

  <div className="space-y-8">

    {appointments.map((appointment) => (

      <div
        key={appointment.id}
        className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition duration-300"
      >

        <div className="flex justify-between items-start">

          <div>

            <h2 className="text-2xl font-bold text-gray-800">
              <div className="flex items-center gap-4">

    <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">

        <FaUser className="text-blue-700 text-2xl"/>

    </div>

    <div>

        <h2 className="text-2xl font-bold">
            {appointment.user_name}
        </h2>


    </div>

</div>
            </h2>

            <p className="text-gray-500 mt-2">
              Appointment Request
            </p>

          </div>

          

          <span className="px-5 py-2 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-300 ">
            {appointment.status}
          </span>

        </div>

        <p className="text-sm text-blue-600 mt-1">
    Requested Dermatologist:
    <span className="font-semibold">
        {" "}{appointment.dermatologist_name}
    </span>
</p>

        <div className="grid md:grid-cols-2 gap-6 mt-8">

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">

            <p className="text-gray-500 text-sm">
              Appointment Date
            </p>

            <h3 className="font-bold mt-2">
              {new Date(
                appointment.appointment_date
              ).toLocaleString()}
            </h3>

          </div>

          <div className="bg-gray-50 rounded-2xl p-5">

            <p className="text-gray-500 text-sm">
              Status
            </p>

            <h3 className="font-bold mt-2">
              {appointment.status}
            </h3>

          </div>

        </div>

        <div className="mt-8 bg-gradient-to-r from-blue-50 to-cyan-50
border border-blue-100 rounded-2xl p-5">

          <p className="text-gray-500 text-sm mb-2">
            Consultation Reason
          </p>

          <p className="text-gray-700">
            {appointment.reason}
          </p>

        </div>

        <div className="flex justify-end mt-8">

          <Link
            to={`/consultant/patient/${appointment.id}`}
            className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition"
          >
            Review Patient →
          </Link>

        </div>

      </div>

    ))}

  </div>

)}
    </ConsultantLayout>
  );
}

export default ConsultantAppointments;