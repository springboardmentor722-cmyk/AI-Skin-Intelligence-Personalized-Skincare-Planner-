import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function Patients() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await api.get("/consultant/patients");
      setPatients(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 p-8">

      <h1 className="text-4xl font-bold text-green-700 mb-6">
        Patients
      </h1>

      <input
        type="text"
        placeholder="Search Patient..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full md:w-96 p-3 border rounded-lg mb-6"
      />

      <div className="bg-white rounded-xl shadow">

        <table className="w-full">

          <thead className="bg-green-600 text-white">

            <tr>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Age</th>
              <th className="p-4 text-left">Skin Type</th>
              <th className="p-4 text-left">Concern</th>
              <th className="p-4 text-left">Action</th>
            </tr>

          </thead>

          <tbody>

            {filteredPatients.map((patient) => (

              <tr
                key={patient.id}
                className="border-b hover:bg-gray-50"
              >

                <td className="p-4">{patient.name}</td>

                <td className="p-4">{patient.age}</td>

                <td className="p-4">{patient.skin_type}</td>

                <td className="p-4">{patient.concerns}</td>

                <td className="p-4">

                  <button
                    onClick={() =>
                      navigate(`/consultant/patient/${patient.id}`)
                    }
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    View
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

export default Patients;