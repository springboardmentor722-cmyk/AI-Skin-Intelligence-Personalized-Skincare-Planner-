import React from "react";
import ImageCard from "./ImageCard";

export default function SkinConcernCard({
  id,
  title,
  description,
  image,
  isSelected,
  onToggle
}) {
  return (
    <ImageCard
      id={id}
      title={title}
      description={description}
      imageSrc={image}
      isSelected={isSelected}
      onSelect={onToggle}
      isMultiSelect={true}
    />
  );
}
