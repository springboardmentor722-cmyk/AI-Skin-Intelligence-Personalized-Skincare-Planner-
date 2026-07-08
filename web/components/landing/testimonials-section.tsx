import Image from "next/image";
import { Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    quote:
      "I've spent years guessing which products work. Skinlytics showed me exactly why my barrier was compromised and how to fix it in 3 weeks.",
    image: "/images/landing/img_007_72524f73.jpg",
    name: "Sarah Chen",
    meta: "Skin Score improved +24%",
  },
  {
    quote:
      "The precision is incredible. It even factors in the hard water in my neighborhood. My routine has never felt more accurate.",
    image: "/images/landing/img_008_422e36c6.jpg",
    name: "Marcus Reed",
    meta: "Daily user for 8 months",
  },
];

export function TestimonialsSection() {
  return (
    // primary-container (not primary) — a fixed dark navy accent band in both themes,
    // unlike `primary` which inverts per theme (docs/DESIGN.md's colors-dark tokens).
    <section className="bg-primary-container text-on-primary-container py-24">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="font-heading mb-12 text-3xl font-bold">Real skin. Real data.</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {TESTIMONIALS.map((testimonial) => (
            <div
              key={testimonial.name}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-12"
            >
              <Quote className="text-secondary mb-6 size-9" strokeWidth={1.5} />
              <p className="mb-8 text-2xl leading-tight font-medium">&ldquo;{testimonial.quote}&rdquo;</p>
              <div className="flex items-center gap-4">
                <div className="relative size-12 overflow-hidden rounded-full">
                  <Image src={testimonial.image} alt={testimonial.name} fill sizes="48px" className="object-cover" />
                </div>
                <div>
                  <p className="font-sans font-bold">{testimonial.name}</p>
                  <p className="text-on-primary-container/60 font-sans text-sm">{testimonial.meta}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
