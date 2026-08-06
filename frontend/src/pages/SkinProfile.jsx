import { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";

import {
  getSkinProfile,
  createSkinProfile,
  updateSkinProfile,
} from "../services/skinProfileService";

import normalSkin from "../assets/skin-types/normal.png";
import drySkin from "../assets/skin-types/dry.png";
import oilySkin from "../assets/skin-types/oily.png";
import combinationSkin from "../assets/skin-types/combination.png";
import sensitiveSkin from "../assets/skin-types/sensitive.png";

import acneImg from "../assets/concerns/acne.png";
import pigmentationImg from "../assets/concerns/pigmentation.png";
import rednessImg from "../assets/concerns/redness.png";
import wrinklesImg from "../assets/concerns/wrinkles.png";
import darkImg from "../assets/concerns/dark-circles.png";
import poresImg from "../assets/concerns/large-pores.png";
import dehydratedImg from "../assets/concerns/dehydration.png";

import {
  FaLeaf,
  
  FaSave,
} from "react-icons/fa";

function SkinProfile() {
  const [profile, setProfile] = useState({
    skin_type: "",
    skin_tone: "",
    skin_concerns: "",
    allergies: "",
    sensitivity: "",
  });


  const [profileExists, setProfileExists] = useState(false);
  const [selectedConcerns, setSelectedConcerns] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getSkinProfile();
        setProfile(data);

setSelectedConcerns(
  data.skin_concerns
    ? data.skin_concerns.split(",")
    : []
);
        setProfileExists(true);
      } catch (error) {
        if (error.response?.status === 404) {
          setProfileExists(false);
        } else {
          console.error(error);
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

    const updatedProfile = {
  ...profile,
  skin_concerns: selectedConcerns.join(","),
};

    try {
      if (profileExists) {
        await updateSkinProfile(updatedProfile);
        alert("Skin Profile Updated Successfully");
      } else {
        await createSkinProfile(updatedProfile);
        alert("Skin Profile Created Successfully");
        setProfileExists(true);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to save Skin Profile");
    }
  };

  const skinTypes = [
  {
    name: "Normal",
    image: normalSkin,
  },
  {
    name: "Dry",
    image: drySkin,
  },
  {
    name: "Oily",
    image: oilySkin,
  },
  {
    name: "Combination",
    image: combinationSkin,
  },
  {
    name: "Sensitive",
    image: sensitiveSkin,
  },
];


const concernOptions = [
  {
    name: "Acne",
    image: acneImg,
  },
  {
    name: "Pigmentation",
    image: pigmentationImg,
  },
  {
    name: "Redness",
    image: rednessImg,
  },
  {
    name: "Wrinkles",
    image: wrinklesImg,
  },
  {
    name: "Dark Circles",
    image: darkImg,
  },
  {
    name: "Large Pores",
    image: poresImg,
  },
  {
    name: "Dehydrated",
    image: dehydratedImg,
  },
];


  return (
    <DashboardLayout>

<div className="max-w-7xl mx-auto">

{/* Hero */}

<div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-green-700 via-emerald-600 to-green-500 p-10 mb-10 shadow-xl">

    <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10"></div>

    <div className="flex items-center justify-between">

        <div>

            <p className="text-green-100 text-lg">

                AI Personalized Profile

            </p>

            <h1 className="text-5xl font-bold text-white mt-2">

                Skin Profile

            </h1>

            <p className="text-green-50 mt-5 text-lg max-w-2xl leading-8">

                Complete your profile so our AI can recommend
                the best skincare routine, products and treatments.

            </p>

        </div>

        <div className="hidden lg:flex">

            <div className="w-32 h-32 rounded-full bg-white/15 flex items-center justify-center">

                <FaLeaf className="text-white text-6xl"/>

            </div>

        </div>

    </div>

</div>
<div className="bg-gray-50 rounded-3xl p-8 shadow-sm">
    <h2 className="text-2xl font-bold text-gray-800 mb-5">
        Select Your Skin Type
    </h2>

    <div className="grid grid-cols-2 md:grid-cols-5 gap-5">

        {/* skinTypes.map() */}

    </div>
    </div>


<div className="bg-white rounded-[32px] shadow-xl border border-gray-100 p-10">
        <form onSubmit={handleSubmit} className="space-y-5">

          <div>

  <div className="grid grid-cols-2 md:grid-cols-5 gap-5">

{skinTypes.map((type)=>(
<div

key={type.name}

onClick={()=>
setProfile({
...profile,
skin_type:type.name
})
}

className={`cursor-pointer rounded-2xl overflow-hidden border-4 transition duration-300 hover:scale-105

${
profile.skin_type===type.name
?"border-green-600 shadow-xl"
:"border-transparent"
}
`}

>

<img
src={type.image}
alt={type.name}
className="w-full h-40 object-cover"
/>

<div className="text-center py-3 font-semibold">
{type.name}
</div>

</div>


))}

</div>

</div>


<div className="bg-gray-50 rounded-3xl p-8 shadow-sm">

    <h2 className="text-2xl font-bold text-gray-800 mb-5">
        Select Your Skin Concerns
    </h2>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">

        {/* concernOptions.map() */}

    </div>



          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">

{concernOptions.map((concern)=>{

const selected=selectedConcerns.includes(concern.name);

return(

<div

key={concern.name}

onClick={()=>{

if(selected){

setSelectedConcerns(

selectedConcerns.filter(
c=>c!==concern.name
)

);

}else{

setSelectedConcerns(
[
...selectedConcerns,
concern.name
]
);

}

}}

className={`cursor-pointer rounded-2xl overflow-hidden border-4 transition duration-300 hover:scale-105

${
selected
?"border-green-600 shadow-xl"
:"border-transparent"
}
`}

>

<img

src={concern.image}

alt={concern.name}

className="w-full h-40 object-cover"

/>

<div className="text-center py-3 font-semibold">

{concern.name}

</div>

</div>

);

})}

</div>
</div>

          <div className="mt-10">

<h2 className="text-2xl font-bold mb-5">
Skin Tone
</h2>

<div className="grid grid-cols-2 md:grid-cols-5 gap-4">

{["Fair","Light","Medium","Wheatish","Dark"].map((tone)=>(

<button
key={tone}
type="button"
onClick={()=>
setProfile({
...profile,
skin_tone:tone
})
}

className={`rounded-2xl p-5 border-2 transition

${
profile.skin_tone===tone
?"border-green-600 bg-green-50"
:"border-gray-200 hover:border-green-300"
}

`}
>

{tone}

</button>

))}

</div>

</div>

          <div className="mt-12">

  <label className="block text-2xl font-bold text-gray-800 mb-5">
    Allergies
  </label>

  <textarea
    rows={4}
    name="allergies"
    value={profile.allergies}
    onChange={handleChange}
    placeholder="Example: Fragrance, Alcohol, Parabens..."
    className="w-full rounded-3xl border border-gray-200 p-5 resize-none focus:ring-2 focus:ring-green-500 outline-none transition"
  />

</div>

          <div className="mt-12">

    <h2 className="text-2xl font-bold text-gray-800 mb-6">

        Skin Sensitivity

    </h2>

    <div className="grid grid-cols-3 gap-5">

        {["Low","Medium","High"].map((level)=>(
            <button
                key={level}
                type="button"
                onClick={()=>
                    setProfile({
                        ...profile,
                        sensitivity: level,
                    })
                }
                className={`rounded-2xl p-6 border-2 font-semibold transition-all
                ${
                    profile.sensitivity===level
                    ? "bg-green-50 border-green-600 text-green-700"
                    : "border-gray-200 hover:border-green-300"
                }`}
            >

                {level==="Low" && " Low"}

                {level==="Medium" && " Medium"}

                {level==="High" && " High"}

            </button>
        ))}

    </div>

</div>

          <div className="mt-14 flex justify-center">

    <button
        type="submit"
        className="flex items-center gap-3 px-12 py-5 rounded-3xl bg-gradient-to-r from-green-700 to-emerald-500 text-white text-lg font-bold shadow-xl hover:scale-105 transition-all duration-300"
    >

        <FaSave />

        {profileExists
            ? "Update Skin Profile"
            : "Create Skin Profile"}

    </button>

</div>

        </form>
      </div>
      </div>
    </DashboardLayout>
  );
}

export default SkinProfile;