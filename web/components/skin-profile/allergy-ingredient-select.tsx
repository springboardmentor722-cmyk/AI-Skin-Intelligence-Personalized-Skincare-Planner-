"use client";

import { useDeferredValue, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { api } from "@/lib/api";

export interface AllergyIngredient {
  ingredient_id: number;
  ingredient_name: string;
}

const isSameIngredient = (a: AllergyIngredient, b: AllergyIngredient) =>
  a.ingredient_id === b.ingredient_id;

// docs/DECISIONS.md ADR-026 — allergies are structured ingredient ids so P12's
// allergy detection can match against them; this searches the same
// GET /api/v1/ingredients?q= the Ingredients screen already uses, no new endpoint.
export function AllergyIngredientSelect({
  value,
  onChange,
}: {
  value: AllergyIngredient[];
  onChange: (value: AllergyIngredient[]) => void;
}) {
  const anchor = useComboboxAnchor();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const ingredientsQuery = useQuery({
    queryKey: ["ingredients", "search", deferredQuery],
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/ingredients", {
        params: { query: { q: deferredQuery || undefined, page_size: 20 } },
      });
      return (data?.items ?? []).map((i) => ({
        ingredient_id: i.ingredient_id,
        ingredient_name: i.ingredient_name,
      }));
    },
  });

  return (
    <Combobox
      multiple
      items={ingredientsQuery.data ?? []}
      filter={null}
      value={value}
      onValueChange={onChange}
      inputValue={query}
      onInputValueChange={setQuery}
      itemToStringLabel={(item: AllergyIngredient) => item.ingredient_name}
      isItemEqualToValue={isSameIngredient}
    >
      <ComboboxChips ref={anchor}>
        <ComboboxValue>
          {(values: AllergyIngredient[]) => (
            <>
              {values.map((item) => (
                <ComboboxChip key={item.ingredient_id}>{item.ingredient_name}</ComboboxChip>
              ))}
              <ComboboxChipsInput
                placeholder={value.length === 0 ? "Search ingredients..." : undefined}
                aria-label="Allergies"
              />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>No ingredients found.</ComboboxEmpty>
        <ComboboxList>
          {(item: AllergyIngredient) => (
            <ComboboxItem key={item.ingredient_id} value={item}>
              {item.ingredient_name}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
