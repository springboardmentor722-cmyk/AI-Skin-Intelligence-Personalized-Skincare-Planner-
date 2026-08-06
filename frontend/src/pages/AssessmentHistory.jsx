import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { getAssessmentHistory } from "../services/assessmentService";

function AssessmentHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await getAssessmentHistory();
        setHistory(data);
      } catch (error) {
        console.error(error);
        alert("Failed to load history.");
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  return (
    <DashboardLayout>

      <div className="max-w-7xl mx-auto">

{/* Hero */}

<div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-green-700 via-emerald-600 to-green-500 p-10 mb-10 shadow-xl">

    <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10"></div>

    <div className="flex items-center justify-between">

        <div>

            <p className="text-green-100 text-lg">
                AI Timeline
            </p>

            <h1 className="text-5xl font-bold text-white mt-2">
                Assessment History
            </h1>

            <p className="text-green-50 mt-5 text-lg max-w-2xl leading-8">
                View every AI skin analysis you've completed and monitor your
                skin improvement over time.
            </p>

        </div>

        <div className="hidden lg:flex">

            <div className="w-32 h-32 rounded-full bg-white/15 flex items-center justify-center text-6xl">

                📈

            </div>

        </div>

    </div>

</div>

{/* Summary */}

{history.length > 0 && (

<div className="grid md:grid-cols-3 gap-6 mb-10">

<div className="bg-white rounded-3xl shadow-xl p-8">

<p className="text-gray-500">
Total Assessments
</p>

<h2 className="text-5xl font-bold text-green-600 mt-3">

{history.length}

</h2>

</div>

<div className="bg-white rounded-3xl shadow-xl p-8">

<p className="text-gray-500">
Latest Score
</p>

<h2 className="text-5xl font-bold text-blue-600 mt-3">

{history[0].overall_score}

</h2>

</div>

<div className="bg-white rounded-3xl shadow-xl p-8">

<p className="text-gray-500">
Skin Type
</p>

<h2 className="text-4xl font-bold text-purple-600 mt-3">

{history[0].skin_type}

</h2>

</div>

</div>

)}

{loading ? (

<div className="text-center py-24 text-2xl font-bold">

Loading Assessment History...

</div>

) : history.length === 0 ? (

<div className="bg-white rounded-3xl shadow-xl p-20 text-center">

<div className="text-7xl mb-5">

📋

</div>

<h2 className="text-3xl font-bold text-gray-700">

No Assessments Found

</h2>

<p className="text-gray-500 mt-4">

Complete your first AI Skin Assessment to begin tracking progress.

</p>

</div>

) : (

<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

{history.map((item,index)=>(

<div
key={item.id}
className="bg-white rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden"
>

<div className="bg-gradient-to-r from-green-600 to-emerald-500 p-5 text-white">

<p className="text-sm">

Assessment #{history.length-index}

</p>

<h2 className="text-2xl font-bold mt-2">

{item.overall_score}/100

</h2>

</div>

<div className="p-6">

<div className="space-y-4">

<div className="flex justify-between">

<span className="text-gray-500">

Date

</span>

<span className="font-semibold">

{new Date(item.created_at).toLocaleDateString()}

</span>

</div>

<div className="flex justify-between">

<span className="text-gray-500">

Skin Type

</span>

<span className="font-semibold text-blue-600">

{item.skin_type}

</span>

</div>

</div>

<div className="mt-6">

<div className="w-full bg-gray-200 rounded-full h-3">

<div

className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full"

style={{
width:`${item.overall_score}%`
}}

>

</div>

</div>

</div>

<button
onClick={() => setSelectedAssessment(item)}
className="mt-8 w-full py-3 rounded-2xl bg-gradient-to-r from-green-700 to-emerald-500 text-white font-bold hover:scale-105 transition"
>

View Report

</button>

</div>

</div>

))}

</div>

)}

</div>

{selectedAssessment && (

<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">

<div className="bg-white rounded-[32px] shadow-2xl w-full max-w-3xl p-8 relative max-h-[90vh] overflow-y-auto">

<button
onClick={() => setSelectedAssessment(null)}
className="absolute right-6 top-6 text-3xl text-gray-400 hover:text-black"
>

×

</button>

<h2 className="text-4xl font-bold text-green-700 mb-8">

🧠 AI Assessment Report

</h2>

<div className="grid grid-cols-2 gap-6">

<div className="bg-green-50 rounded-2xl p-5">

<p className="text-gray-500">

Overall Score

</p>

<h3 className="text-5xl font-bold text-green-700 mt-2">

{selectedAssessment.overall_score}/100

</h3>

</div>

<div className="bg-blue-50 rounded-2xl p-5">

<p className="text-gray-500">

Skin Type

</p>

<h3 className="text-4xl font-bold text-blue-700 mt-2">

{selectedAssessment.skin_type}

</h3>

</div>

</div>

<div className="mt-10">

<h3 className="text-2xl font-bold mb-6">

Assessment Scores

</h3>

{[
["Acne", selectedAssessment.acne_score],
["Pigmentation", selectedAssessment.pigmentation_score],
["Redness", selectedAssessment.redness_score],
["Wrinkles", selectedAssessment.wrinkles_score],
["Dark Circles", selectedAssessment.dark_circle_score],
].map(([title, score]) => (

<div key={title} className="mb-5">

<div className="flex justify-between mb-2">

<span className="font-semibold">

{title}

</span>

<span>

{score}/100

</span>

</div>

<div className="w-full bg-gray-200 rounded-full h-3">

<div

className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full"

style={{
width:`${score}%`
}}

>

</div>

</div>

</div>

))}

</div>

<div className="mt-10 bg-green-50 rounded-3xl p-6">

<h3 className="text-2xl font-bold mb-4">

📅 Assessment Date

</h3>

<p className="text-lg">

{new Date(selectedAssessment.created_at).toLocaleDateString()}

</p>

</div>

<div className="mt-10 flex justify-end">

<button
onClick={() => setSelectedAssessment(null)}
className="px-8 py-4 rounded-2xl bg-gradient-to-r from-green-700 to-emerald-500 text-white font-bold"
>

Close

</button>

</div>

</div>

</div>

)}

    </DashboardLayout>
  );
}

export default AssessmentHistory;