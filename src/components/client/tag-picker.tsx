"use client";

import { cn } from "@/lib/utils";

export function TagPicker({ name, options, selected, onChange }: { name: string; options: readonly string[]; selected: string[]; onChange: (tags: string[]) => void }) {
  return (
    <fieldset>
      <legend className="nn-label">{name}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((tag) => {
          const active = selected.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? selected.filter((value) => value !== tag) : [...selected, tag])}
              className={cn(
                "min-h-[36px] rounded-full border px-3 text-body-sm transition-colors",
                active ? "border-nest bg-nest-soft font-medium text-nest" : "border-line bg-surface-raised text-ink-muted hover:bg-surface-sunken"
              )}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
