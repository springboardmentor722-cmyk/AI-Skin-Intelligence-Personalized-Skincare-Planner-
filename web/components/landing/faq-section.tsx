import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    question: "How accurate is the AI scan?",
    // "Not medical advice" framing per docs/AGENTS.md §4 — AI output carries
    // confidence/advisory framing, never presents itself as a diagnosis.
    answer:
      "Every scan reports a confidence score alongside its findings. Skinlytics is a skincare intelligence tool, not a diagnostic device — results are advisory, not medical advice.",
  },
  {
    question: "Does it replace a dermatologist?",
    answer:
      "No. Skinlytics complements professional care — our Dermatologist role lets you share your data with a licensed provider, but nothing in the app is a substitute for medical diagnosis or treatment.",
  },
  {
    question: "Is my data kept private?",
    answer:
      "Yes. Skin photos and profile data are stored privately, only ever served via signed URLs, and you can request full deletion at any time.",
  },
];

export function FaqSection() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <h2 className="font-heading text-on-surface mb-12 text-center text-3xl font-bold">
        Frequently asked
      </h2>
      <Accordion className="gap-4">
        {FAQS.map((faq, i) => (
          <AccordionItem
            key={faq.question}
            value={`faq-${i}`}
            className="border-border bg-card mb-4 rounded-2xl border px-6 py-2 last:border-b"
          >
            <AccordionTrigger className="font-sans font-bold no-underline hover:no-underline">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-on-surface-variant font-sans">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
