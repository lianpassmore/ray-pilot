interface TimeMeterProps {
  progress: number; // 0-100
}

export default function TimeMeter({ progress }: TimeMeterProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="relative w-[60px] h-1 bg-[#E0E0E0] rounded-full overflow-hidden">
      <div
        className="absolute top-0 left-0 h-full bg-forest-green transition-all duration-300"
        style={{ width: `${clampedProgress}%` }}
      />
    </div>
  );
}
