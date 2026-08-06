import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";

import {
  getAppointments,
  deleteAppointment,
} from "../services/appointmentService";

function MyAppointments() {

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

  const fetchAppointments = async () => {

    try {

      setLoading(true);

      const data = await getAppointments();

      setAppointments(data);

    } catch (error) {

      console.error(error);

      alert("Failed to load appointments.");

    } finally {

      setLoading(false);

    }

  };

  fetchAppointments();

}, []);

  const handleCancel = async (id) => {

  if (!window.confirm("Cancel this appointment?")) return;

  try {

    await deleteAppointment(id);

    const data = await getAppointments();

    setAppointments(data);

    alert("Appointment cancelled.");

  } catch (error) {

    console.error(error);

    alert("Unable to cancel appointment.");

  }

};

  return (

    <DashboardLayout>

      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-green-700 via-emerald-600 to-green-500 p-10 mb-10 shadow-xl">

  <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10"></div>

  <div className="flex items-center justify-between">

    <div>

      <p className="text-green-100 text-lg">
        Dermatologist Consultation
      </p>

      <h1 className="text-5xl font-bold text-white mt-2">
        My Appointments
      </h1>

      <p className="text-green-50 mt-5 text-lg max-w-2xl">
        View your booked appointments, track their status, and manage upcoming consultations.
      </p>

    </div>

    <div className="hidden lg:flex">

      <div className="w-32 h-32 rounded-full bg-white/15 flex items-center justify-center text-6xl">
        📅
      </div>

    </div>

  </div>

</div>

      {loading ? (

        <div className="text-center py-20 text-xl">
          Loading...
        </div>

      ) : appointments.length === 0 ? (

        <div className="bg-white rounded-[30px] shadow-xl p-20 text-center">

    <div className="text-7xl mb-6">
        📅
    </div>

    <h2 className="text-3xl font-bold">
        No Appointments Yet
    </h2>

    <p className="text-gray-500 mt-4">
        Book your first dermatologist appointment to receive professional skincare advice.
    </p>

</div>

      ) : (

        <div className="space-y-6">

          {appointments.map((appointment) => (

            <div
              key={appointment.id}
              className="bg-white rounded-[28px] shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition duration-300"
            >

              <div className="flex justify-between items-start">

                <div>

                  <h2 className="text-2xl font-bold text-gray-800">
                    Appointment #{appointment.id}
                  </h2>

                  <p className="text-gray-500 mt-2 flex items-center gap-2">

📅

{new Date(appointment.appointment_date).toLocaleString()}

</p>

                </div>

                <span
className={`px-5 py-2 rounded-full text-sm font-bold shadow

${
appointment.status==="PENDING"
?"bg-yellow-100 text-yellow-700"

:appointment.status==="APPROVED"
?"bg-green-100 text-green-700"

:appointment.status==="ASSIGNED"
?"bg-blue-100 text-blue-700"

:"bg-red-100 text-red-700"
}`}
>

{appointment.status==="PENDING" && "🟡 Pending"}

{appointment.status==="APPROVED" && "🟢 Approved"}

{appointment.status==="ASSIGNED" && "🔵 Assigned"}

{appointment.status==="REJECTED" && "🔴 Rejected"}

</span>

              </div>

              <div className="mt-8 bg-gray-50 rounded-2xl p-5 border">
                <h3 className="font-semibold">
                  Reason
                </h3>

                <p className="text-gray-700 mt-1">
                  {appointment.reason}
                </p>

              </div>

              {appointment.status === "PENDING" && (

                <button
                  onClick={() => handleCancel(appointment.id)}
                  className="mt-8 bg-gradient-to-r from-red-600 to-red-500 hover:scale-105 transition px-8 py-3 rounded-2xl text-white font-bold shadow-lg"
                >
                  Cancel Appointment
                </button>

              )}

            </div>

          ))}

        </div>

      )}

    </DashboardLayout>

  );

}

export default MyAppointments;