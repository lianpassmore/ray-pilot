"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import AnimatedRayCircle from "@/components/AnimatedRayCircle";

export default function Home() {
  return (
    <div className="min-h-screen relative flex flex-col bg-linen selection:bg-clay selection:text-linen overflow-hidden">
      
      {/* --- HEADER (Matches Dashboard) --- */}
      <header className="absolute top-0 left-0 w-full px-8 py-6 z-20">
        <h1 className="text-2xl font-black tracking-[0.25em] text-charcoal">RAY</h1>
      </header>

      {/* --- MAIN STAGE --- */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 w-full max-w-lg mx-auto px-6">

        {/* 1. THE ORB (Central Focus) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mb-16 relative"
        >
          {/* Using the same size as Dashboard for consistency */}
          <AnimatedRayCircle state="idle" size={220} />
        </motion.div>

        {/* 2. THE TEXT (Editorial Typography) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
          className="text-center space-y-6"
        >
          {/* Matches Dashboard: Thin/Bold contrast */}
          <h2 className="text-4xl md:text-5xl tracking-tight text-charcoal leading-tight">
            <span className="font-light">Kia ora,</span>{' '}
            <span className="font-bold">I'm Ray.</span>
          </h2>

          <p className="text-lg md:text-xl text-charcoal/80 font-medium leading-relaxed max-w-xs mx-auto">
            A thinking partner when you need a second take.
          </p>
          
          <p className="text-sm text-warm-grey italic font-serif">
            "Clarity over comfort."
          </p>
        </motion.div>

        {/* 3. THE ENTRY ACTION */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-16"
        >
          <Link
            href="/login"
            className="group flex items-center justify-center px-10 py-4 bg-charcoal text-linen font-bold text-xs uppercase tracking-[0.25em] rounded-sm transition-all hover:bg-clay hover:shadow-lg hover:-translate-y-0.5"
          >
             Enter
          </Link>
        </motion.div>

        {/* --- PILOT LABEL --- */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-6 text-[10px] text-warm-grey uppercase tracking-widest font-bold opacity-60"
        >
          Research Pilot • Feb 12-26
        </motion.p>

      </main>

    </div>
  );
}