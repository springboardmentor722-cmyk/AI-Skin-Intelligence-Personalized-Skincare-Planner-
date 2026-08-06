import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import RoutineCard from "../components/dashboard/RoutineCard";
import { getRoutine } from "../services/recommendationService";
import {
  
  updateRoutineStep,
} from "../services/recommendationService";

function Routine() {

    const [morning, setMorning] = useState([]);
    const [night, setNight] = useState([]);
    const [loading, setLoading] = useState(true);
    const [completed, setCompleted] = useState({});

    useEffect(() => {

        const fetchRoutine = async () => {

            try {

                const data = await getRoutine();

                setMorning(data.morning || []);
setNight(data.night || []);
setCompleted(data.completed || {});

            } catch (error) {

                console.error(error);

            } finally {

                setLoading(false);

            }

        };

        fetchRoutine();

    }, []);

    const handleRoutineCheck = async (
  routineType,
  item,
  checked
) => {

  const stepName = item.split(" - ")[0];

  try {

    await updateRoutineStep(
      routineType,
      stepName,
      checked
    );

    setCompleted((prev) => {

      const updated = { ...prev };

      const current =
        updated[routineType] || [];

      if (checked) {

        updated[routineType] = [
          ...current,
          stepName,
        ];

      } else {

        updated[routineType] =
          current.filter(
            (x) => x !== stepName
          );

      }

      return updated;

    });

  } catch (err) {

    console.error(err);

  }

};

    return (

        <DashboardLayout>

            <div className="max-w-7xl mx-auto">

                <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-green-700 via-emerald-600 to-green-500 p-10 mb-10 shadow-xl">

                    <h1 className="text-5xl font-bold text-white">
                        AI Skincare Routine
                    </h1>

                    <p className="text-green-100 mt-5 text-lg">
                        Your personalized morning and night skincare routine generated from AI recommendations.
                    </p>

                </div>

                {
                    loading ? (

                        <div className="text-center py-20">

                            <h2 className="text-3xl font-bold">
                                Loading Routine...
                            </h2>

                        </div>

                    ) : (

                        <div className="grid lg:grid-cols-2 gap-10">

                            <RoutineCard
    title="Morning Routine"
    icon="☀️"
    items={morning}
    completedSteps={completed.Morning || []}
    routineType="Morning"
    onToggle={handleRoutineCheck}
/>

                            <RoutineCard
    title="Night Routine"
    icon="🌙"
    items={night}
    completedSteps={completed.Night || []}
    routineType="Night"
    onToggle={handleRoutineCheck}
/>

                        </div>

                    )
                }

            </div>

        </DashboardLayout>

    );

}

export default Routine;