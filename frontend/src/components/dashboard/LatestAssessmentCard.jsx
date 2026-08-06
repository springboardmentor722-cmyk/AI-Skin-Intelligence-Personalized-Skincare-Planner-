import { useEffect, useState } from "react";
import { getLatestAssessment } from "../../services/dashboardService";

function LatestAssessmentCard() {
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const data = await getLatestAssessment();
        setAssessment(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-lg p-10 text-center">

    <div className="text-4xl mb-3">
        🔬
    </div>

    <p className="text-gray-500 text-lg">

        Loading Latest Assessment...

    </p>

</div>
    );
  }

  if (!assessment || assessment.message) {
    return (
      <div className="bg-white rounded-3xl shadow-lg p-12 text-center">

    <div className="text-6xl mb-4">

        📷

    </div>

    <h2 className="text-2xl font-bold mb-3">

        No Assessment Yet

    </h2>

    <p className="text-gray-500">

        Complete your first AI skin assessment to view detailed insights.

    </p>

</div>
    );
  }

  return (

<div className="mt-10">

    <div className="flex items-center justify-between mb-6">

        <div>

            <h2 className="text-3xl font-bold text-gray-800">

                🔬 Latest Skin Assessment

            </h2>

            <p className="text-gray-500 mt-1">

                AI analyzed your latest skin condition.

            </p>

        </div>

    </div>

    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

        {/* Header */}

        <div className="bg-gradient-to-r from-green-700 to-emerald-500 p-6 text-white">

            <h2 className="text-3xl font-bold">

                {assessment.skin_type} Skin

            </h2>

            <p className="mt-2 text-green-100">

                Overall Skin Score

            </p>

            <div className="text-5xl font-bold mt-3">

                {assessment.overall_score}

            </div>

        </div>

        {/* Scores */}

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-5 p-8">

            <div className="bg-red-50 rounded-2xl p-5 text-center">

                <p className="text-gray-500 text-sm">

                    Acne

                </p>

                <h3 className="text-3xl font-bold text-red-500 mt-2">

                    {assessment.acne_score}

                </h3>

            </div>

            <div className="bg-yellow-50 rounded-2xl p-5 text-center">

                <p className="text-gray-500 text-sm">

                    Pigmentation

                </p>

                <h3 className="text-3xl font-bold text-yellow-600 mt-2">

                    {assessment.pigmentation_score}

                </h3>

            </div>

            <div className="bg-pink-50 rounded-2xl p-5 text-center">

                <p className="text-gray-500 text-sm">

                    Redness

                </p>

                <h3 className="text-3xl font-bold text-pink-500 mt-2">

                    {assessment.redness_score}

                </h3>

            </div>

            <div className="bg-indigo-50 rounded-2xl p-5 text-center">

                <p className="text-gray-500 text-sm">

                    Dark Circles

                </p>

                <h3 className="text-3xl font-bold text-indigo-600 mt-2">

                    {assessment.dark_circle_score}

                </h3>

            </div>

            <div className="bg-purple-50 rounded-2xl p-5 text-center">

                <p className="text-gray-500 text-sm">

                    Wrinkles

                </p>

                <h3 className="text-3xl font-bold text-purple-600 mt-2">

                    {assessment.wrinkles_score}

                </h3>

            </div>

        </div>

        {/* AI Summary */}

        <div className="px-8 pb-8">

            <div className="bg-green-50 border border-green-100 rounded-2xl p-6">

                <h3 className="text-xl font-bold text-green-700 mb-3">

                    🤖 AI Summary

                </h3>

                <p className="text-gray-700 leading-8">

                    {assessment.ai_summary}

                </p>

            </div>

        </div>

    </div>

</div>

);
}

export default LatestAssessmentCard;