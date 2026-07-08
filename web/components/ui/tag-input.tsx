"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  "aria-label"?: string;
}

// No shadcn tag-input primitive exists (docs/WIREFRAMES.md calls for one under
// "allergies (tag input)") — small custom component, built from the same tonal-fill
// input styling as the rest of the form rather than a new visual pattern.
export function TagInput({ value, onChange, placeholder, ...aria }: TagInputProps) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const tag = draft.trim();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setDraft("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-muted px-3 py-2 focus-within:ring-2 focus-within:ring-secondary/40">
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-0.5 font-sans text-xs text-secondary"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            aria-label={`Remove ${tag}`}
            className="hover:text-destructive"
          >
            <X className="size-3" strokeWidth={2} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        placeholder={value.length === 0 ? placeholder : undefined}
        aria-label={aria["aria-label"]}
        className={cn(
          "min-w-[8ch] flex-1 bg-transparent font-sans text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none"
        )}
      />
    </div>
  );
}
