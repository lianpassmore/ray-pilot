import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    // min-h-screen ensures full height, flex-center centers everything
    <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Optional: A very subtle background element or glow could go here */}

      <div className="flex flex-col items-center w-full max-w-sm animate-[fadeIn_0.8s_ease-out]">

        {/* 1. The Focal Point */}
        <div className="mb-10">
          <Image src="/logo.svg" alt="Ray" width={110} height={110} priority />
        </div>

        {/* 2. The Headline */}
        <h1 className="heading-xl text-center mb-3">
          Kia ora, I'm Ray.
        </h1>

        {/* 3. The Anchor / Tagline */}
        {/* Using serif/italic here creates a nice contrast with the heavy headline */}
        <p className="text-[18px] text-warm-grey italic font-serif mb-8 tracking-wide">
          Clarity over comfort.
        </p>

        {/* 4. The Body */}
        <p className="body-text text-center mb-12 opacity-80">
          I'm an AI relationship coach designed to help you see patterns clearly. 
          Not a therapist. Just a wise mate on the back porch.
        </p>

        {/* 5. The Action */}
        <div className="w-full flex flex-col gap-6 items-center">
          <Link href="/login" className="btn-primary">
            Sign In
          </Link>
          
          <div className="caption">
            Research Pilot • Feb 12-26
          </div>
        </div>

      </div>
    </main>
  );
}