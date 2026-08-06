import React from "react";
import FeatureCard from "./FeatureCard";

const CHIP_FEATURES = [
  { title: "AI Scanner" },
  { title: "Clinical Ingredients" },
  { title: "Routine Engine" },
  { title: "Progress Tracking" }
];

export default function FeatureGrid({ features = CHIP_FEATURES }) {
  return (
    <div className="hidden sm:flex flex-wrap items-center gap-2 sm:gap-2.5 w-full">
      {features.map((feat, idx) => (
        <FeatureCard
          key={feat.title}
          title={feat.title}
          index={idx}
        />
      ))}
    </div>
  );
}
