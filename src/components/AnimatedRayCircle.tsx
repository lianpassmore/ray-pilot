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
  
  // BRAND COLORS MAPPED TO STATES
  const getFillColor = () => {
    switch (state) {
      case "idle": return "rgba(255,255,255,0.4)"; // Soft white, transparent-ish
      case "connected": return "#2C2C2C"; // Charcoal (Listening/Thinking)
      case "speaking": return "#2C2C2C";  // Charcoal (Speaking)
      default: return "rgba(255,255,255,0.4)";
    }
  };

  const getBorderColor = () => {
    if (state === "idle") return "rgba(255,255,255,0.6)"; // Soft white border
    return "#2C2C2C"; // Charcoal when active
  };

  // The Inner Icon (...)
  const getIconColor = () => {
    if (state === "idle") return "#7A7A7A"; // Warm Grey
    return "#F5F5DC"; // Linen (Inverse when filled)
  };

  // Pulse Animation (The "Breathing")
  const pulseVariants: Variants = {
    idle: { scale: 1, opacity: 0 },
    connected: {
      scale: [1, 1.2],
      opacity: [0.1, 0],
      transition: { duration: 2, repeat: Infinity, ease: "easeOut" },
    },
    speaking: {
      scale: [1, 1.3],
      opacity: [0.2, 0],
      transition: { duration: 1, repeat: Infinity, ease: "easeOut" },
    },
  };

  return (
    <div
      className="relative flex items-center justify-center cursor-pointer"
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      {/* Pulse Ring (Atmosphere) */}
      <motion.div
        className="absolute inset-0 rounded-full border border-charcoal"
        variants={pulseVariants}
        animate={state}
      />

      {/* Main Circle (The Button) */}
      <motion.div
        className="relative flex items-center justify-center rounded-full border-2 transition-colors duration-500"
        style={{
          width: size,
          height: size,
          backgroundColor: getFillColor(),
          borderColor: getBorderColor(),
        }}
        // Subtle breathing even when idle
        animate={state === 'speaking' ? { scale: [1, 1.05, 1] } : { scale: 1 }}
        transition={{ duration: 0.5, repeat: state === 'speaking' ? Infinity : 0 }}
      >
        {/* The "Ellipsis" Icon */}
        <span
          className="font-light tracking-widest transition-colors duration-300"
          style={{
            fontSize: Math.floor(size * 0.3),
            lineHeight: 0,
            paddingBottom: size * 0.1,
            color: getIconColor(),
          }}
        >
          ...
        </span>
      </motion.div>
    </div>
  );
}