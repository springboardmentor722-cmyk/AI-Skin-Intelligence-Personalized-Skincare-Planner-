import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { getProfile, updateProfile } from "../services/profileService";
import {
  FaUserCircle,
  FaUser,
  FaEnvelope,
  FaBirthdayCake,
  FaVenusMars,
  FaUserTag,
  FaSave,
} from "react-icons/fa";

function Profile() {
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    age: "",
    gender: "",
    role: "",
  });

  

  useEffect(() => {
  const fetchProfile = async () => {
    try {
      const data = await getProfile();
      setProfile(data);
    } catch (error) {
  console.error("Profile Error:", error);

  if (error.response) {
    console.log("Status:", error.response.status);
    console.log("Data:", error.response.data);
    alert(JSON.stringify(error.response.data));
  } else {
    alert(error.message);
  }
}
  };

  fetchProfile();
}, []);

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await updateProfile({
        full_name: profile.full_name,
        age: Number(profile.age),
        gender: profile.gender,
      });

      alert("Profile Updated Successfully");
    } catch (error) {
      console.error(error);
      alert("Failed to update profile");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">

<div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 p-10 mb-10 shadow-xl">

<div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10"></div>

<div className="flex justify-between items-center">

<div>

<p className="text-blue-100 text-lg">
Account Settings
</p>

<h1 className="text-5xl font-bold text-white mt-2">
My Profile
</h1>

<p className="text-blue-50 mt-5 text-lg max-w-2xl">
Manage your personal information and account settings.
</p>

</div>

<div className="hidden lg:flex">

<div className="w-32 h-32 rounded-full bg-white/15 flex items-center justify-center">

<FaUserCircle className="text-white text-7xl"/>

</div>

</div>

</div>

</div>

<div className="bg-white rounded-[32px] shadow-xl border border-gray-100 p-10">
        <form onSubmit={handleSubmit} className="space-y-5">

          <div>

<label className="flex items-center gap-2 font-semibold mb-2">

<FaUser className="text-blue-600"/>

Full Name

</label>

<input
type="text"
name="full_name"
value={profile.full_name}
onChange={handleChange}
className="w-full rounded-2xl border border-gray-300 p-4 focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
/>

</div>

          <div>

<label className="flex items-center gap-2 font-semibold mb-2">

<FaEnvelope className="text-blue-600"/>

Email

</label>

<input
type="email"
value={profile.email}
disabled
className="w-full rounded-2xl border border-gray-200 bg-gray-100 p-4"
/>

</div>

          <div>

<label className="flex items-center gap-2 font-semibold mb-2">

<FaBirthdayCake className="text-pink-600"/>

Age

</label>

<input
type="number"
name="age"
value={profile.age}
onChange={handleChange}
className="w-full rounded-2xl border border-gray-300 p-4 focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
/>

</div>

          <div>

<label className="flex items-center gap-2 font-semibold mb-2">

<FaVenusMars className="text-purple-600"/>

Gender

</label>

<select
name="gender"
value={profile.gender}
onChange={handleChange}
className="w-full rounded-2xl border border-gray-300 p-4"
>

<option value="">Select Gender</option>

<option value="Male">Male</option>

<option value="Female">Female</option>

<option value="Other">Other</option>

</select>

</div>

          <div>

<label className="flex items-center gap-2 font-semibold mb-2">

<FaUserTag className="text-green-600"/>

Current Role

</label>

<input
type="text"
value={profile.role}
disabled
className="w-full rounded-2xl border border-gray-200 bg-gray-100 p-4"
/>

</div>

          <div className="flex justify-center mt-10">

<button
type="submit"
className="flex items-center gap-3 px-12 py-5 rounded-3xl bg-gradient-to-r from-blue-700 to-cyan-500 text-white text-lg font-bold shadow-xl hover:scale-105 transition-all duration-300"
>

<FaSave />

Save Changes

</button>

</div>


        </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Profile;