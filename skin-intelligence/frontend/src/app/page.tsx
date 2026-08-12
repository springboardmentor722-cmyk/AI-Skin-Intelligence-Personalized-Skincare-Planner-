import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="max-w-2xl text-5xl font-semibold tracking-tight">
        Understand your skin. <span className="text-primary">Personalize your routine.</span>
      </h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        AI-powered facial analysis, a weighted Skin Health Score, and a routine built just for you.
      </p>
      <Link href="/dashboard" className="mt-8 rounded-full bg-primary px-8 py-3 font-medium text-primary-foreground shadow-lg">
        Start Your Skin Scan
      </Link>
    </main>
  );
}
