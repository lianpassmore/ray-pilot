interface TimeMeterProps {
  progress: number; // 0-100
}

export default function TimeMeter({ progress }: TimeMeterProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="flex items-center gap-2" title={`Pilot Progress: ${Math.round(clampedProgress)}%`}>
      {/* The Meter Track */}
      <div className="relative w-20 h-1 bg-charcoal/10 rounded-[1px] overflow-hidden">
        {/* The Fill */}
        <div
          className="absolute top-0 left-0 h-full bg-forest transition-all duration-500 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}