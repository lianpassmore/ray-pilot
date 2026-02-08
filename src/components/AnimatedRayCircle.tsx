"use client";

import { motion, type Variants } from "framer-motion";

interface AnimatedRayCircleProps {
  state: "idle" | "connected" | "speaking";
  size?: number;
  onClick?: () => void;
}

export default function AnimatedRayCircle({
  state,
  size = 200,
  onClick,
}: AnimatedRayCircleProps) {

  const variants: Variants = {
    idle: {
      scale: 1,
      opacity: 0.08,
      backgroundColor: "#2C2C2C",
      borderWidth: 0,
      transition: { duration: 0.5 }
    },
    connected: {
      scale: [1, 1.02, 1],
      opacity: 0.8,
      backgroundColor: "#2C2C2C",
      borderWidth: 0,
      transition: {
        duration: 3,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut"
      },
    },
    speaking: {
      scale: [1, 1.1, 1],
      opacity: 1,
      backgroundColor: "#2C2C2C",
      borderWidth: 0,
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut"
      },
    },
  };

  const rippleVariants: Variants = {
    idle: { opacity: 0 },
    connected: { opacity: 0 },
    speaking: {
      scale: [1, 1.4],
      opacity: [0.2, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeOut",
      },
    }
  };

  return (
    <div
      className="relative flex items-center justify-center cursor-pointer group"
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      {/* Hover Hint */}
      <div className="absolute inset-0 rounded-full border border-charcoal/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 scale-110" />

      {/* Ripple Effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-charcoal"
        variants={rippleVariants}
        animate={state}
      />

      {/* The Main Orb */}
      <motion.div
        className="relative rounded-full flex items-center justify-center"
        style={{
          width: size,
          height: size,
        }}
        variants={variants}
        animate={state}
        initial="idle"
      >
        {/* Ellipsis — only visible when active */}
        {state !== "idle" && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="font-light tracking-[0.3em] text-linen"
            style={{
              fontSize: Math.floor(size * 0.25),
              lineHeight: 0,
              paddingBottom: size * 0.08,
            }}
          >
            ...
          </motion.span>
        )}
      </motion.div>
    </div>
  );
}
