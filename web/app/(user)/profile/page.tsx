import { SkinProfileForm } from "@/components/skin-profile/skin-profile-form";
import { LifestyleForm } from "@/components/skin-profile/lifestyle-form";

// docs/WIREFRAMES.md "4. Skin profile & lifestyle". Not in AGENTS.md's User nav list —
// reached from the post-registration/login redirect and the account menu, not the
// sidebar (a real ambiguity in the docs, noted in PROGRESS.md rather than guessed at).
export default function SkinProfilePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-xl font-semibold text-on-surface">
          Skin profile &amp; lifestyle
        </h1>
        <p className="mt-1 font-sans text-sm text-on-surface-variant">
          Keeps your routine and product recommendations personalized. Not medical
          advice.
        </p>
      </div>
      <SkinProfileForm />
      <LifestyleForm />
    </div>
  );
}
