import { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import {
  getLifestyle,
  createLifestyle,
  updateLifestyle,
} from "../services/lifestyleService";
import {
    FaBed,
    FaTint,
    FaDumbbell,
    FaSmile,
    FaCity,
    FaSave,
    FaLeaf,
} from "react-icons/fa";

function Lifestyle() {
  const [lifestyle, setLifestyle] = useState({
    sleep_duration: "",
    water_intake: "",
    exercise_habits: "",
    stress_level: "",
    environmental_exposure: "",
  });

  const [recordExists, setRecordExists] = useState(false);

  useEffect(() => {
    const fetchLifestyle = async () => {
      try {
        const data = await getLifestyle();
        setLifestyle(data);
        setRecordExists(true);
      } catch (error) {
        if (error.response?.status === 404) {
          setRecordExists(false);
        } else {
          console.error(error);
        }
      }
    };

    fetchLifestyle();
  }, []);

  const handleChange = (e) => {
    setLifestyle({
      ...lifestyle,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        sleep_duration: Number(lifestyle.sleep_duration),
        water_intake: Number(lifestyle.water_intake),
        exercise_habits: lifestyle.exercise_habits,
        stress_level: lifestyle.stress_level,
        environmental_exposure: lifestyle.environmental_exposure,
      };

      if (recordExists) {
        await updateLifestyle(payload);
        alert("Lifestyle Updated Successfully");
      } else {
        await createLifestyle(payload);
        alert("Lifestyle Created Successfully");
        setRecordExists(true);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to save lifestyle");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">

<div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-green-700 via-emerald-600 to-green-500 p-10 mb-10 shadow-xl">

<div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10"></div>

<div className="flex justify-between items-center">

<div>

<p className="text-green-100 text-lg">
Healthy Lifestyle
</p>

<h1 className="text-5xl font-bold text-white mt-2">
Lifestyle Assessment
</h1>

<p className="text-green-50 mt-5 text-lg max-w-2xl">
Daily habits greatly influence your skin health.
Help our AI personalize better recommendations.
</p>

</div>

<div className="hidden lg:flex">

<div className="w-32 h-32 rounded-full bg-white/15 flex items-center justify-center">

<FaLeaf className="text-white text-6xl"/>

</div>

</div>

</div>

</div>

<div className="bg-white rounded-2xl shadow-md p-6 mb-8">

    <div className="flex justify-between items-center mb-3">

        <h3 className="font-bold text-lg">
            Lifestyle Completion
        </h3>

        <span className="text-green-600 font-bold">
            100%
        </span>

    </div>

    <div className="w-full bg-gray-200 rounded-full h-3">

        <div className="bg-green-600 h-3 rounded-full w-full"></div>

    </div>

</div>

<div className="bg-white rounded-[32px] shadow-xl border border-gray-100 p-10">

        <form onSubmit={handleSubmit} className="space-y-5">

          <div className="mb-10">

<div className="flex justify-between mb-3">

<div className="flex items-center gap-3">

<FaBed className="text-green-600"/>

<h2 className="text-xl font-bold">

Sleep Duration

</h2>

</div>

<span className="font-bold">

{lifestyle.sleep_duration || 8} hrs

</span>

</div>

<input
type="range"
min="1"
max="12"
name="sleep_duration"
value={lifestyle.sleep_duration}
onChange={handleChange}
className="w-full accent-green-600"
/>
<p className="text-gray-500 text-sm mt-2">

Recommended: 7–9 hours every night.

</p>

</div>
<hr className="my-10 border-gray-200"/>

          <div className="mb-10">

    <div className="flex justify-between mb-3">

        <div className="flex items-center gap-3">

            <FaTint className="text-sky-500 text-xl"/>

            <h2 className="text-xl font-bold">
                Water Intake
            </h2>

        </div>

        <span className="font-bold text-sky-600">
            {lifestyle.water_intake || 2} L
        </span>

    </div>

    <input
        type="range"
        min="0.5"
        max="6"
        step="0.5"
        name="water_intake"
        value={lifestyle.water_intake}
        onChange={handleChange}
        className="w-full accent-sky-500"
    />

    

    <div className="flex justify-between text-gray-400 text-sm mt-2">
        <span>0.5 L</span>
        <span>6 L</span>
    </div>
    <p className="text-gray-500 text-sm mt-2">

Aim for at least 2 liters of water daily.

</p>

</div>
<hr className="my-10 border-gray-200"/>

          <div className="mt-10">

    <div className="flex items-center gap-3 mb-6">

        <FaDumbbell className="text-green-600 text-xl"/>

        <h2 className="text-2xl font-bold">
            Exercise Habits
        </h2>

    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">

        {["Regular","Occasionally","Rarely","Never"].map((item)=>(

            <button
                key={item}
                type="button"
                onClick={()=>
                    setLifestyle({
                        ...lifestyle,
                        exercise_habits:item
                    })
                }

                className={`rounded-3xl border-2 p-6 transition-all duration-300

                ${
                    lifestyle.exercise_habits===item
                    ?"border-green-600 bg-gradient-to-br from-green-50 to-emerald-100 shadow-xl scale-105"
                    :"border-gray-200 hover:border-green-300 hover:shadow-md"
                }`}
            >

                <div className="text-4xl mb-3">

                    {item==="Regular" && ""}

                    {item==="Occasionally" && ""}

                    {item==="Rarely" && ""}

                    {item==="Never" && ""}

                </div>

                <h3 className="font-semibold text-lg">

                    {item}

                </h3>

            </button>

        ))}

    </div>

</div>
<hr className="my-10 border-gray-200"/>

          <div className="mt-10">

    <div className="flex items-center gap-3 mb-6">

        <FaSmile className="text-yellow-500 text-xl"/>

        <h2 className="text-2xl font-bold">
            Stress Level
        </h2>

    </div>

    <div className="grid grid-cols-3 gap-5">

        {["Low","Moderate","High"].map((level)=>(

            <button
                key={level}
                type="button"
                onClick={()=>
                    setLifestyle({
                        ...lifestyle,
                        stress_level: level
                    })
                }

                className={`rounded-3xl border-2 p-6 transition-all duration-300

                ${
                    lifestyle.stress_level===level
                    ?"border-green-600 bg-gradient-to-br from-green-50 to-emerald-100 shadow-xl scale-105"
                    :"border-gray-200 hover:border-green-300 hover:shadow-md"
                }`}
            >

                <div className="text-5xl mb-4">

                    {level==="Low" && ""}

                    {level==="Moderate" && ""}

                    {level==="High" && ""}

                </div>

                <h3 className="font-bold text-lg">

                    {level}

                </h3>

            </button>

        ))}

    </div>

</div>
<hr className="my-10 border-gray-200"/>

          <div className="mt-10">

    <div className="flex items-center gap-3 mb-6">

        <FaCity className="text-blue-600 text-xl"/>

        <h2 className="text-2xl font-bold">
            Environmental Exposure
        </h2>

    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">

        {[
            {
                name: "Urban",
                icon: "",
            },
            {
                name: "Rural",
                icon: "",
            },
            {
                name: "Industrial",
                icon: "",
            },
            {
                name: "Coastal",
                icon: "",
            },
        ].map((item)=>(

            <button
                key={item.name}
                type="button"
                onClick={()=>
                    setLifestyle({
                        ...lifestyle,
                        environmental_exposure:item.name
                    })
                }

                className={`rounded-3xl border-2 p-6 transition-all duration-300

                ${
                    lifestyle.environmental_exposure===item.name
                    ?"border-green-600 bg-gradient-to-br from-green-50 to-emerald-100 shadow-xl scale-105"
                    :"border-gray-200 hover:border-green-300 hover:shadow-md"
                }`}
            >

                <div className="text-5xl mb-4">

                    {item.icon}

                </div>

                <h3 className="font-bold text-lg">

                    {item.name}

                </h3>

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

        {recordExists
            ? "Update Lifestyle"
            : "Create Lifestyle"}

    </button>

</div>


        </form>

      </div>
      </div>
    </DashboardLayout>
  );
}

export default Lifestyle;