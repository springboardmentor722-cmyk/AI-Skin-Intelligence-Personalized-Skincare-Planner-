import Image from "next/image";

import { Button } from "@/components/ui/button";

// Admin is internal, not signup-facing (docs/AGENTS.md §1) — three public-facing
// roles here, matching the wireframe.
const ROLES = [
  {
    image: "/images/landing/img_004_a5875ee6.jpg",
    alt: "Person checking their skin health on a smartphone",
    title: "For individuals",
    body: "Total control over your skin journey with lab-grade precision at home.",
    cta: "Try the app",
  },
  {
    image: "/images/landing/img_005_25c4b00b.jpg",
    alt: "Skincare consultant analyzing client data on a tablet",
    title: "For consultants",
    body: "Enhance your practice with data-driven insights and client progress monitoring.",
    cta: "Partner portal",
  },
  {
    image: "/images/landing/img_006_91f8d7fc.jpg",
    alt: "Dermatologist examining a digital skin scan",
    title: "For dermatologists",
    body: "Prescribe routines and monitor clinical outcomes through the medical portal.",
    cta: "Medical inquiry",
  },
];

export function RolesSection() {
  return (
    <section id="professionals" className="mx-auto max-w-7xl px-6 py-16">
      <h2 className="font-heading text-on-surface mb-16 text-center text-3xl font-bold">
        Built for the whole ecosystem.
      </h2>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {ROLES.map((role) => (
          <div key={role.title} className="group relative overflow-hidden rounded-[2rem]">
            <div className="relative aspect-4/5 bg-muted">
              <Image src={role.image} alt={role.alt} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
            </div>
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-8 text-white">
              <h3 className="font-heading mb-2 text-xl font-semibold">{role.title}</h3>
              <p className="mb-4 font-sans opacity-80">{role.body}</p>
              <Button className="w-fit bg-white text-black hover:bg-white/90">{role.cta}</Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
