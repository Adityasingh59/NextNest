"use client";

import { useState } from "react";
import { TagPicker } from "@/components/client/tag-picker";
import { FormError, useApi } from "@/components/client/use-api";
import { LIFESTYLE_TAGS, ROOM_TYPE_OPTIONS } from "@/lib/markets";

export type PreferenceDefaults = {
  budgetMin: number;
  budgetMax: number;
  preferredArea: string;
  commuteRadiusMiles: number;
  moveInDate: string;
  leaseDurationMonths: number;
  roomType: string;
  wantsFurnished: boolean;
  lifestyleTags: string[];
};

export function PreferenceForm({ areas, defaults, isUpdate }: { areas: { slug: string; name: string }[]; defaults: PreferenceDefaults; isUpdate: boolean }) {
  const { call, error, isPending, router } = useApi();
  const [tags, setTags] = useState(defaults.lifestyleTags);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const roomType = String(form.get("roomType") ?? "");

    call(
      "/api/preferences",
      {
        budgetMin: form.get("budgetMin"),
        budgetMax: form.get("budgetMax"),
        preferredArea: form.get("preferredArea"),
        commuteRadiusMiles: form.get("commuteRadiusMiles"),
        moveInDate: form.get("moveInDate"),
        leaseDurationMonths: form.get("leaseDurationMonths"),
        roomType: roomType || null,
        wantsFurnished: form.get("wantsFurnished") === "on",
        lifestyleTags: tags
      },
      () => {
        router.push("/dashboard");
        router.refresh();
      }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="budgetMin" className="nn-label">
            Min budget ($/mo)
          </label>
          <input id="budgetMin" name="budgetMin" type="number" min={0} step={25} required defaultValue={defaults.budgetMin} className="nn-input" inputMode="numeric" />
        </div>
        <div>
          <label htmlFor="budgetMax" className="nn-label">
            Max budget ($/mo)
          </label>
          <input id="budgetMax" name="budgetMax" type="number" min={100} step={25} required defaultValue={defaults.budgetMax} className="nn-input" inputMode="numeric" />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="preferredArea" className="nn-label">
            Live near
          </label>
          <select id="preferredArea" name="preferredArea" defaultValue={defaults.preferredArea} className="nn-input">
            {areas.map((area) => (
              <option key={area.slug} value={area.slug}>
                {area.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="commuteRadiusMiles" className="nn-label">
            Within (miles)
          </label>
          <input id="commuteRadiusMiles" name="commuteRadiusMiles" type="number" min={0.25} max={25} step={0.25} required defaultValue={defaults.commuteRadiusMiles} className="nn-input" inputMode="decimal" />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="moveInDate" className="nn-label">
            Move-in date
          </label>
          <input id="moveInDate" name="moveInDate" type="date" required defaultValue={defaults.moveInDate} className="nn-input" />
        </div>
        <div>
          <label htmlFor="leaseDurationMonths" className="nn-label">
            How long (months)
          </label>
          <input id="leaseDurationMonths" name="leaseDurationMonths" type="number" min={1} max={12} required defaultValue={defaults.leaseDurationMonths} className="nn-input" inputMode="numeric" />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="roomType" className="nn-label">
            Room type
          </label>
          <select id="roomType" name="roomType" defaultValue={defaults.roomType} className="nn-input">
            <option value="">No preference</option>
            {ROOM_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <label className="flex min-h-[44px] items-center gap-3 self-end">
          <input type="checkbox" name="wantsFurnished" defaultChecked={defaults.wantsFurnished} className="h-5 w-5 accent-[var(--nest)]" />
          <span>I want it furnished</span>
        </label>
      </section>

      <TagPicker name="Lifestyle" options={LIFESTYLE_TAGS} selected={tags} onChange={setTags} />

      <p className="text-body-sm text-ink-muted">Your preferences are only used for matching. Other students never see them.</p>
      <FormError message={error} />
      <button type="submit" className="nn-btn nn-btn-primary nn-btn-lg" disabled={isPending}>
        {isPending ? "Saving…" : isUpdate ? "Update my matches" : "See my matches"}
      </button>
    </form>
  );
}
