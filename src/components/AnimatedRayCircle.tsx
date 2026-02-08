"use client";

import { motion, type Variants } from "framer-motion";
import { useMemo, useState, useEffect } from "react";

interface AnimatedRayCircleProps {
  state: "idle" | "connected" | "speaking";
  size?: number;
  onClick?: () => void;
  accentColor?: "clay" | "green";
}

// Brand Palette
const COLORS = {
  linen: "#F5F5DC",
  charcoal: "#2C2C2C",
  forestGreen: "#2F4F2F", // The "Soul" color
  clay: "#8B4513",
  white: "#FFFFFF",
};

// 3D Projection Helper
function project3D(x: number, y: number, z: number, size: number) {
  const fov = 350; // Field of view
  const scale = fov / (fov + z);
  const cx = size / 2;
  const cy = size / 2;
  return {
    x: x * scale + cx,
    y: y * scale + cy,
    z: z,
    scale: scale,
  };
}

export default function AnimatedRayCircle({
  state,
  size = 200,
  onClick,
  accentColor = "green", 
}: AnimatedRayCircleProps) {
  const [time, setTime] = useState(0);

  // --- Animation Loop ---
  useEffect(() => {
    let frame: number;
    // Speaking = Fast jitter; Idle = Slow breathing
    const speed = state === "speaking" ? 0.08 : 0.015;

    function animate() {
      setTime((prev) => prev + speed);
      frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [state]);

  // --- Generate the "Liquid Mesh" ---
  const meshData = useMemo(() => {
    const radius = size * 0.4;
    const latLines = 18; 
    const lonLines = 26; 
    
    // Store 3D points
    const points: { x: number; y: number; z: number }[][] = [];

    // 1. Calculate Vertices with Organic Noise
    for (let lat = 0; lat <= latLines; lat++) {
      const phi = (Math.PI * lat) / latLines;
      const row: { x: number; y: number; z: number }[] = [];

      for (let lon = 0; lon <= lonLines; lon++) {
        const theta = (2 * Math.PI * lon) / lonLines;

        // Base Sphere
        const sinPhi = Math.sin(phi);
        let x = radius * sinPhi * Math.cos(theta);
        let y = radius * Math.cos(phi);
        let z = radius * sinPhi * Math.sin(theta);

        // --- THE MASHUP MAGIC: FLUID DISTORTION ---
        // We distort the radius based on time to make the wireframe "wobble"
        const amplitude = state === "speaking" ? 10 : 4; // How much it bulges
        const frequency = state === "speaking" ? 5 : 2;  // How complex the shape is

        // A simple "noise" function using sine waves
        const distortion = 
          Math.sin(phi * frequency + time) * 
          Math.cos(theta * frequency + time * 0.5) * 
          amplitude;

        // Apply fluid distortion
        const r = radius + distortion;
        x = r * sinPhi * Math.cos(theta);
        y = r * Math.cos(phi);
        z = r * sinPhi * Math.sin(theta);

        // Apply Slow Rotation
        const rotY = time * 0.2;
        const rotX = time * 0.1;
        
        // Rotation Math
        const x1 = x * Math.cos(rotY) - z * Math.sin(rotY);
        const z1 = x * Math.sin(rotY) + z * Math.cos(rotY);
        const y2 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
        const z2 = y * Math.sin(rotX) + z1 * Math.cos(rotX);

        row.push(project3D(x1, y2, z2, size));
      }
      points.push(row);
    }

    // 2. Generate SVG Paths
    let path = "";
    
    // Horizontal Lines (Latitudes)
    for (let lat = 0; lat <= latLines; lat++) {
      for (let lon = 0; lon < lonLines; lon++) {
        const p1 = points[lat][lon];
        const p2 = points[lat][lon + 1];
        // Only draw lines that aren't too far back to reduce visual clutter
        if (p1.z > -radius * 0.5) {
            path += `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} L ${p2.x.toFixed(1)} ${p2.y.toFixed(1)} `;
        }
      }
    }

    // Vertical Lines (Longitudes)
    for (let lat = 0; lat < latLines; lat++) {
      for (let lon = 0; lon <= lonLines; lon++) {
        const p1 = points[lat][lon];
        const p2 = points[lat + 1][lon];
        if (p1.z > -radius * 0.5) {
            path += `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} L ${p2.x.toFixed(1)} ${p2.y.toFixed(1)} `;
        }
      }
    }

    return path;
  }, [time, size, state]);

  // --- Animation Variants ---
  const accentHex = accentColor === "clay" ? COLORS.clay : COLORS.forestGreen;

  // The inner soul breathes independently
  const coreVariants: Variants = {
    idle: { scale: [0.8, 0.9, 0.8], opacity: 0.5 },
    connected: { scale: 1, opacity: 0.7 },
    speaking: { scale: [1, 1.2, 1], opacity: 0.8, transition: { duration: 0.5, repeat: Infinity } },
  };

  return (
    <div
      className="relative flex items-center justify-center cursor-pointer group"
      style={{ width: size * 1.5, height: size * 1.5 }}
      onClick={onClick}
    >
      {/* 1. ATMOSPHERE (Outer Glow) */}
      <motion.div
        className="absolute rounded-full blur-2xl"
        style={{
          width: size,
          height: size,
          background: accentHex,
          opacity: 0.2,
        }}
        animate={{ scale: state === "speaking" ? 1.2 : 1 }}
      />

      {/* 2. THE SOUL (Inner Colored Core) */}
      <motion.div
        className="absolute rounded-full blur-xl"
        style={{
          width: size * 0.6,
          height: size * 0.6,
          background: `radial-gradient(circle, ${accentHex} 0%, transparent 70%)`,
        }}
        variants={coreVariants}
        animate={state}
      />

      {/* 3. THE LIQUID MESH (Structure) */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="relative z-10 overflow-visible"
        style={{ 
          filter: "drop-shadow(0px 0px 4px rgba(44, 44, 44, 0.3))" 
        }}
      >
        <path
          d={meshData}
          fill="none"
          stroke={COLORS.charcoal}
          strokeWidth="0.8"        // Slightly thicker than before for structure
          strokeOpacity="0.6"      // Good visibility against Linen
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* 4. RIPPLE (Speaking State) */}
      {state === "speaking" && (
        <motion.div
            className="absolute rounded-full border border-charcoal/20"
            style={{ width: size * 0.9, height: size * 0.9 }}
            animate={{ scale: [1, 1.5], opacity: [1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
        />
      )}
    </div>
  );
}