import React from "react";
import ImageCard from "./ImageCard";
import { Sparkles, CheckCircle2 } from "lucide-react";

export default function SkinTypeCard({
  id,
  title,
  description,
  characteristics = [],
  image,
  isSelected,
  onSelect
}) {
  return (
    <ImageCard
      id={id}
      title={title}
      description={description}
      imageSrc={image}
      isSelected={isSelected}
      onSelect={onSelect}
      isMultiSelect={false}
      badgeText={isSelected ? "AI Matched Baseline" : undefined}
    >
      {/* Characteristics Bullet Points */}
      {characteristics && characteristics.length > 0 && (
        <div className="mt-3 pt-3 border-t border-amber-900/10 space-y-1.5 text-left">
          {characteristics.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-[11px] font-medium text-amber-900/80">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
    </ImageCard>
  );
}
