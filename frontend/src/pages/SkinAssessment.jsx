import { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { uploadSkinImage } from "../services/aiService";

function ScoreBar({ title, score }) {
  return (
    <div className="mb-5">

      <div className="flex justify-between mb-1">

        <span className="font-medium">
          {title}
        </span>

        <span>
          {score}/100
        </span>

      </div>

      <div className="w-full bg-gray-300 rounded-full h-4">

        <div
          className="bg-blue-600 h-4 rounded-full"
          style={{
            width: `${score}%`
          }}
        />

      </div>

    </div>
  );
}

function SkinAssessment() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpload = async () => {
    if (!image) {
      alert("Please select an image.");
      return;
    }

    try {
      setLoading(true);

      const response = await uploadSkinImage(image);

setResult(response.assessment);

alert("Skin assessment completed successfully!");

    } catch (error) {
      console.error(error);
      alert("Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>

      <div className="max-w-7xl mx-auto">

<div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-green-700 via-emerald-600 to-green-500 p-10 mb-10 shadow-xl">

<div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10"></div>

<div className="flex justify-between items-center">

<div>

<p className="text-green-100 text-lg">

AI Powered Analysis

</p>

<h1 className="text-5xl font-bold text-white mt-2">

Skin Assessment

</h1>

<p className="text-green-50 mt-5 text-lg max-w-2xl leading-8">

Upload a clear selfie and let our AI analyze your skin health,
identify concerns, and provide personalized skincare insights.

</p>

</div>

<div className="hidden lg:flex">

<div className="w-32 h-32 rounded-full bg-white/15 flex items-center justify-center text-6xl">

🤖

</div>

</div>

</div>

</div>
</div>

      <div className="bg-white rounded-[32px] shadow-xl border border-gray-100 p-10">

        <label className="block">

<input
type="file"
accept="image/*"
className="hidden"
onChange={(e)=>{

const file=e.target.files[0];

if(file){

setImage(file);

setPreview(URL.createObjectURL(file));

}

}}
/>

<div className="border-2 border-dashed border-green-400 rounded-3xl p-12 text-center cursor-pointer hover:bg-green-50 transition">

<div className="text-6xl mb-4">

📸

</div>

<h2 className="text-2xl font-bold">

Upload Skin Image

</h2>

<p className="text-gray-500 mt-3">

Click here to choose a clear facial image.

</p>

</div>

</label>

{preview && (
  <div className="mt-4">
    <img
      src={preview}
      alt="Selected Skin"
      className="w-80 h-80 object-cover rounded-[30px] mx-auto shadow-2xl mt-8"
    />
  </div>
)}
        <button
          onClick={handleUpload}
          disabled={loading}
          className="mt-10 mx-auto flex items-center justify-center px-12 py-5 rounded-3xl bg-gradient-to-r from-green-700 to-emerald-500 text-white text-lg font-bold shadow-xl hover:scale-105 transition-all duration-300"
        >
          {loading ? "🤖 AI is analyzing..." : "Upload & Analyze"}
        </button>

        {result && (
  <div className="mt-12 bg-white rounded-[32px] shadow-xl border border-gray-100 p-10">

    <h2 className="text-3xl font-bold text-blue-700 mb-6">
      AI Skin Assessment Report
    </h2>

    <div className="grid md:grid-cols-2 gap-8">

      <div className="rounded-3xl bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-700">
          Skin Type
        </h3>

        <p className="text-2xl font-bold text-blue-700">
          {result.skin_type}
        </p>
      </div>

      <div className="rounded-3xl bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-700">
          Overall Score
        </h3>

        <p className="text-2xl font-bold text-green-700">
          {result.overall_score}/100
        </p>
      </div>

    </div>

    <div className="mt-8">

      <ScoreBar
        title="Acne"
        score={result.acne_score}
      />

      <ScoreBar
        title="Pigmentation"
        score={result.pigmentation_score}
      />

      <ScoreBar
        title="Redness"
        score={result.redness_score}
      />

      <ScoreBar
        title="Wrinkles"
        score={result.wrinkles_score}
      />

      <ScoreBar
        title="Dark Circles"
        score={result.dark_circle_score}
      />

    </div>

    <div className="mt-8 bg-gray-100 p-5 rounded-lg">

      <h3 className="mt-10 bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl p-8 border border-green-100">
        AI Summary
      </h3>

      <p>
        {result.ai_summary}
      </p>

    </div>

  </div>
)}

      </div>

    </DashboardLayout>
  );
}

export default SkinAssessment;