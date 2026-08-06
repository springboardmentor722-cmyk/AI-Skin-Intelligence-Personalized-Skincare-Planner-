import { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { applyRole } from "../services/roleRequestService";

function ApplyRole() {
  const [requestedRole, setRequestedRole] = useState("");
  const [qualification, setQualification] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [experience, setExperience] = useState("");
  const [certificate, setCertificate] = useState(null);
const [idProof, setIdProof] = useState(null);

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const formData = new FormData();

    formData.append("requested_role", requestedRole);
    formData.append("qualification", qualification);
    formData.append("license_number", licenseNumber);
    formData.append("experience", experience);
    formData.append("certificate", certificate);
    formData.append("id_proof", idProof);

    await applyRole(formData);

    alert("Application Submitted Successfully!");

    setRequestedRole("");
    setQualification("");
    setLicenseNumber("");
    setExperience("");
    setCertificate(null);
    setIdProof(null);

  } catch (error) {
    console.error(error);

    if (error.response) {
      alert(error.response.data.detail);
    } else {
      alert("Failed to submit application.");
    }
  }
};

  return (
    <DashboardLayout>

      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-green-700 via-emerald-600 to-green-500 p-10 mb-10 shadow-xl">

<div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10"></div>

<div className="flex justify-between items-center">

<div>

<p className="text-green-100 text-lg">

Career Opportunities

</p>



<h1 className="text-5xl font-bold text-white mt-2">

Apply for a Role

</h1>

<p className="text-green-50 mt-5 text-lg max-w-2xl">

Join our AI Skin Intelligence platform and help thousands of users with professional skincare guidance.

</p>

</div>

<div className="hidden lg:flex">

<div className="w-32 h-32 rounded-full bg-white/15 flex items-center justify-center text-6xl">

💼

</div>

</div>

</div>

</div>

      <div className="bg-white rounded-[32px] shadow-xl border border-gray-100 p-10 max-w-5xl mx-auto">

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
        <h2 className="text-2xl font-bold text-gray-800 col-span-2">

Professional Information

</h2>
          <div>
            <label className="block font-medium mb-2">
              Requested Role
            </label>

            <select
              value={requestedRole}
              onChange={(e) =>
                setRequestedRole(e.target.value)
              }
              className="w-full rounded-2xl border border-gray-200 p-4 focus:ring-2 focus:ring-green-500 outline-none transition"
              required
            >
              <option value="">
                Select Role
              </option>

              <option value="consultant">
                Consultant
              </option>

              <option value="dermatologist">
                Dermatologist
              </option>

            </select>

          </div>

          <div>

            <label className="block font-medium mb-2">
              Qualification
            </label>

            <input
              type="text"
              value={qualification}
              onChange={(e) =>
                setQualification(e.target.value)
              }
              className="w-full rounded-2xl border border-gray-200 p-4 focus:ring-2 focus:ring-green-500 outline-none transition"
              placeholder="Enter Qualification"
              required
            />

          </div>

          <div>

            <label className="block font-medium mb-2">
              License Number
            </label>

            <input
              type="text"
              value={licenseNumber}
              onChange={(e) =>
                setLicenseNumber(e.target.value)
              }
              className="w-full rounded-2xl border border-gray-200 p-4 focus:ring-2 focus:ring-green-500 outline-none transition"
              placeholder="Enter License Number"
              required
            />

          </div>

          <div>

            <label className="block font-medium mb-2">
              Experience
            </label>

            <input
              type="text"
              value={experience}
              onChange={(e) =>
                setExperience(e.target.value)
              }
              className="w-full rounded-2xl border border-gray-200 p-4 focus:ring-2 focus:ring-green-500 outline-none transition"
              placeholder="Example: 2 Years"
              required
            />

            <h2 className="text-2xl font-bold text-gray-800 col-span-2 mt-6">

Verification Documents

</h2>

           <div className="grid md:grid-cols-2 gap-8">

  {/* Certificate Upload */}
  <div>

    <label className="block font-semibold mb-3">
      Certificate
    </label>

    <label className="flex flex-col items-center justify-center h-52 border-2 border-dashed border-green-400 rounded-2xl cursor-pointer hover:bg-green-50 transition">

      <div className="text-5xl mb-3">📄</div>

      <h3 className="font-bold text-lg">
        Upload Certificate
      </h3>

      <p className="text-gray-500 text-sm mb-3">
        PDF / JPG / PNG
      </p>

      <span className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">
        Choose File
      </span>

      {certificate && (
        <p className="mt-3 text-green-700 text-sm font-medium">
          {certificate.name}
        </p>
      )}

      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(e) => setCertificate(e.target.files[0])}
        className="hidden"
        required
      />

    </label>

  </div>

  {/* ID Proof Upload */}
  <div>

    <label className="block font-semibold mb-3">
      ID Proof
    </label>

    <label className="flex flex-col items-center justify-center h-52 border-2 border-dashed border-blue-400 rounded-2xl cursor-pointer hover:bg-blue-50 transition">

      <div className="text-5xl mb-3">🪪</div>

      <h3 className="font-bold text-lg">
        Upload ID Proof
      </h3>

      <p className="text-gray-500 text-sm mb-3">
        PDF / JPG / PNG
      </p>

      <span className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
        Choose File
      </span>

      {idProof && (
        <p className="mt-3 text-blue-700 text-sm font-medium">
          {idProof.name}
        </p>
      )}

      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(e) => setIdProof(e.target.files[0])}
        className="hidden"
        required
      />

    </label>

  </div>

</div>

          </div>

         <div className="col-span-2 flex justify-center mt-6">

<button

type="submit"

className="flex items-center gap-3 px-14 py-5 rounded-3xl bg-gradient-to-r from-green-700 to-emerald-500 text-white text-lg font-bold shadow-xl hover:scale-105 transition"

>

Submit Application

</button>

</div>

        </form>

      </div>

    </DashboardLayout>
  );
}

export default ApplyRole;