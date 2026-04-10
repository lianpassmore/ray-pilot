'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedRayCircle from '@/components/AnimatedRayCircle';
import GuestRayWidget from '@/components/GuestRayWidget';

export default function GuestPage() {
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) setSubmitted(true);
  };

  return (
    <div className="min-h-screen relative flex flex-col bg-linen selection:bg-clay selection:text-linen overflow-hidden">

      <header className="absolute top-0 left-0 w-full px-8 py-6 z-20">
        <h1 className="text-2xl font-black tracking-[0.25em] text-charcoal">RAY</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center relative z-10 w-full max-w-lg mx-auto px-6">

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="name-entry"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="flex flex-col items-center w-full"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="mb-12"
              >
                <AnimatedRayCircle state="idle" size={180} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-center space-y-4 mb-12"
              >
                <h2 className="text-3xl md:text-4xl tracking-tight text-charcoal leading-tight">
                  <span className="font-light">Kia ora,</span>{' '}
                  <span className="font-bold">I'm Ray.</span>
                </h2>
                <p className="text-base text-charcoal/70 font-medium">
                  What should I call you?
                </p>
              </motion.div>

              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                onSubmit={handleSubmit}
                className="w-full max-w-xs flex flex-col items-center gap-4"
              >
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoFocus
                  className="w-full bg-white/70 border border-charcoal/15 focus:border-charcoal/40 rounded-sm px-5 py-4 text-center text-charcoal text-base focus:outline-none transition-all placeholder:text-warm-grey/40"
                />
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="w-full flex items-center justify-center px-10 py-4 bg-charcoal text-linen font-bold text-xs uppercase tracking-[0.25em] rounded-sm transition-all hover:bg-clay hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-30 disabled:pointer-events-none"
                >
                  Enter
                </button>
              </motion.form>
            </motion.div>
          ) : (
            <motion.div
              key="widget"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="w-full flex flex-col items-center"
            >
              <GuestRayWidget userName={name.trim()} />
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
