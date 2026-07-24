"use client";

import { useParams } from "next/navigation";

import { IngredientDetail } from "@/components/ingredients/ingredient-detail";

export default function Page() {
  const params = useParams<{ id: string }>();
  return (
    <IngredientDetail
      ingredientId={Number(params.id)}
      basePath="/admin/ingredients"
      backLabel="Ingredient Database"
    />
  );
}
