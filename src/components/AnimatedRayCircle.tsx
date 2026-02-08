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

  // Soft glow that surrounds the orb — ethereal halo
  const glowVariants: Variants = {
    idle: {
      scale: [1, 1.15, 1],
      opacity: [0.04, 0.1, 0.04],
      transition: {
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    connected: {
      scale: [1, 1.2, 1],
      opacity: [0.08, 0.15, 0.08],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    speaking: {
      scale: [1, 1.35, 1],
      opacity: [0.1, 0.25, 0.1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
  };

  const orbVariants: Variants = {
    idle: {
      scale: [1, 1.04, 1],
      opacity: [0.15, 0.3, 0.15],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    connected: {
      scale: [1, 1.02, 1],
      opacity: 0.85,
      transition: {
        duration: 3,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut"
      },
    },
    speaking: {
      scale: [1, 1.08, 1],
      opacity: 1,
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
      scale: [1, 1.5],
      opacity: [0.15, 0],
      transition: {
        duration: 2.5,
        repeat: Infinity,
        ease: "easeOut",
      },
    }
  };

  return (
    <div
      className="relative flex items-center justify-center cursor-pointer group"
      style={{ width: size * 1.4, height: size * 1.4 }}
      onClick={onClick}
    >
      {/* Ethereal glow — soft blurred halo behind the orb */}
      <motion.div
        className="absolute rounded-full bg-charcoal"
        style={{
          width: size * 1.3,
          height: size * 1.3,
          filter: "blur(40px)",
        }}
        variants={glowVariants}
        animate={state}
        initial="idle"
      />

      {/* Ripple (speaking only) */}
      <motion.div
        className="absolute rounded-full bg-charcoal"
        style={{
          width: size,
          height: size,
          filter: "blur(8px)",
        }}
        variants={rippleVariants}
        animate={state}
      />

      {/* The Main Orb */}
      <motion.div
        className="relative rounded-full flex items-center justify-center bg-charcoal"
        style={{
          width: size,
          height: size,
          boxShadow: state === "idle"
            ? "0 0 60px rgba(44,44,44,0.08)"
            : "0 0 80px rgba(44,44,44,0.2)",
        }}
        variants={orbVariants}
        animate={state}
        initial="idle"
      >
        {/* Ellipsis */}
        <motion.span
          animate={{
            opacity: state === "idle" ? 0.4 : 1,
          }}
          transition={{ duration: 0.5 }}
          className="font-light tracking-[0.3em]"
          style={{
            fontSize: Math.floor(size * 0.25),
            lineHeight: 0,
            paddingBottom: size * 0.08,
            color: state === "idle" ? "#2C2C2C" : "#F5F5DC",
          }}
        >
          ...
        </motion.span>
      </motion.div>
    </div>
  );
}
