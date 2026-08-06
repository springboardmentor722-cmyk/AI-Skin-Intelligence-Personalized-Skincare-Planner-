function ProgressCard({ progress }) {
  return (
    <div className="bg-white rounded-[30px] overflow-hidden border border-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">

      <div className="bg-gradient-to-r from-green-700 to-emerald-500 p-6">

<div className="flex justify-between items-center">

<div>

<h2 className="text-2xl font-bold text-white">

🧠 AI Assessment

</h2>

<p className="text-green-100 mt-2">

{progress.date}

</p>

</div>

<div className="text-5xl">

📈

</div>

</div>

</div>

<div className="p-6">

      <div className="space-y-3">

        <div>

<p className="text-gray-400 text-sm">

Skin Type

</p>

<span className="inline-block mt-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-semibold">

{progress.skin_type}

</span>

</div>
       <div className="mt-3 bg-green-50 rounded-2xl p-5 text-center">

<p className="text-gray-500">

Overall Skin Score

</p>

<p className="text-2xl font-bold text-green-700 mt-2">

{progress.overall_score}%

</p>

</div>

        <div className="grid grid-cols-2 gap-4 mt-8">

<div className="mt-6 space-y-3">

<div className="flex justify-between">
<span>🔴 Acne</span>
<span className="font-bold">{progress.acne_score}</span>
</div>

<div className="flex justify-between">
<span>🟤 Pigmentation</span>
<span className="font-bold">{progress.pigmentation_score}</span>
</div>

<div className="flex justify-between">
<span>🟠 Redness</span>
<span className="font-bold">{progress.redness_score}</span>
</div>

<div className="flex justify-between">
<span>🟣 Wrinkles</span>
<span className="font-bold">{progress.wrinkles_score}</span>
</div>

<div className="flex justify-between">
<span>⚫ Dark Circles</span>
<span className="font-bold">{progress.dark_circle_score}</span>
</div>

</div>
<div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-5">

<h3 className="font-bold text-green-700 mb-2">

🤖 AI Insight

</h3>

<p className="text-sm text-gray-600">
Skin health is improving. Keep following your personalized routine.
</p>

</div>

</div>

</div>
      </div>
      </div>

    
  );
}

export default ProgressCard;