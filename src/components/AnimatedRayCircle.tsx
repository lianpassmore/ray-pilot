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
  // Determine fill color based on state
  const getFillColor = () => {
    switch (state) {
      case "idle":
        return "transparent";
      case "connected":
        return "#2F4F2F"; // forest-green
      case "speaking":
        return "#2C2C2C"; // charcoal
      default:
        return "transparent";
    }
  };

  // Animation variants for the main circle
  const circleVariants: Variants = {
    idle: {
      scale: 1,
      transition: { duration: 0.3 },
    },
    connected: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "mirror",
      },
    },
    speaking: {
      scale: [1, 1.15, 1],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 0.4,
        repeat: Infinity,
      },
    },
  };

  // Pulse ring variants (only visible during connected/speaking)
  const pulseRingVariants: Variants = {
    idle: {
      scale: 1,
      opacity: 0,
    },
    connected: {
      scale: [1, 1.3],
      opacity: [0.5, 0],
      transition: {
        duration: 1.5,
        repeat: Infinity,
      },
    },
    speaking: {
      scale: [1, 1.3],
      opacity: [0.7, 0],
      transition: {
        duration: 1.5,
        repeat: Infinity,
      },
    },
  };

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      {/* Pulse Ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-2"
        style={{
          borderColor: getFillColor() === "transparent" ? "#2C2C2C" : getFillColor(),
        }}
        variants={pulseRingVariants}
        animate={state}
      />

      {/* Main Circle */}
      <motion.div
        className="relative flex items-center justify-center rounded-full border-2 cursor-pointer"
        style={{
          width: size,
          height: size,
          backgroundColor: getFillColor(),
          borderColor: "#2C2C2C", // charcoal border always
        }}
        variants={circleVariants}
        animate={state}
        initial="idle"
      >
        {/* Inner Ellipsis Icon */}
        <span
          className="font-light text-warm-grey"
          style={{
            fontSize: Math.floor(size * 0.4),
            lineHeight: 1,
            color: state === "speaking" ? "#F5F5DC" : "#7A7A7A",
          }}
        >
          ...
        </span>
      </motion.div>
    </div>
  );
}
