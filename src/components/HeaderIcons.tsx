import { Lightbulb } from "lucide-react";

interface HeaderIconsProps {
  onSettingsClick?: () => void;
}

export default function HeaderIcons({
  onSettingsClick,
}: HeaderIconsProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onSettingsClick}
        className="p-2 text-charcoal hover:text-clay transition-colors"
        aria-label="About & Support"
      >
        <Lightbulb size={20} />
      </button>
    </div>
  );
}
