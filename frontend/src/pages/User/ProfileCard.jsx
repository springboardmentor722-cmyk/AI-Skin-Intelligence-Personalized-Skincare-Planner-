import { useEffect, useState } from "react";
import api from "../../services/api";

function ProfileCard() {
  const [profile, setProfile] = useState(null);

  const loadProfile = async () => {
    try {
      const res = await api.get("/my-profile");
      setProfile(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  if (!profile) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        Loading Profile...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-green-700">
          My Skin Profile
        </h2>

        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
          Edit
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">

        <div>
          <p className="text-gray-500">Full Name</p>
          <h3>{profile.full_name}</h3>
        </div>

        <div>
          <p className="text-gray-500">Age</p>
          <h3>{profile.age}</h3>
        </div>

        <div>
          <p className="text-gray-500">Gender</p>
          <h3>{profile.gender}</h3>
        </div>

        <div>
          <p className="text-gray-500">Skin Type</p>
          <h3>{profile.skin_type}</h3>
        </div>

        <div>
          <p className="text-gray-500">Skin Tone</p>
          <h3>{profile.skin_tone}</h3>
        </div>

        <div>
          <p className="text-gray-500">Concerns</p>
          <h3>{profile.concerns}</h3>
        </div>

      </div>

    </div>
  );
}

export default ProfileCard;