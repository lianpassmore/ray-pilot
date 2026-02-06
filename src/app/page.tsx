import Link from "next/link";
import AnimatedRayCircle from "@/components/AnimatedRayCircle";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-linen">

      {/* Hero Section */}
      <div className="flex flex-col items-center gap-6 max-w-md">

        {/* Animated Logo */}
        <div className="mb-4">
          <AnimatedRayCircle state="idle" size={96} />
        </div>

        <h1 className="text-4xl font-bold text-charcoal">
          Kia ora, I'm Ray.
        </h1>

        <p className="text-lg text-charcoal leading-relaxed font-medium mb-2">
          Clarity over comfort.
        </p>

        <p className="text-base text-warm-grey leading-relaxed">
          I'm an AI relationship coach designed to help you see patterns clearly.
          Not a therapist. Just a wise mate on the back porch.
        </p>

        <div className="flex flex-col gap-4 w-full mt-8">
          <Link href="/login" className="btn-primary text-center">
            Sign In
          </Link>
          <div className="text-xs text-warm-grey uppercase tracking-widest mt-4">
            Research Pilot • Feb 12-26
          </div>
        </div>
      </div>

    </main>
  );
}