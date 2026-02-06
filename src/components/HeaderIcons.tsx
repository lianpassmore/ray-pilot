import { ScrollText, Brain, Link2, Settings } from "lucide-react";

interface HeaderIconsProps {
  onHistoryClick?: () => void;
  onMemoryClick?: () => void;
  onPartnerClick?: () => void;
  onSettingsClick?: () => void;
}

export default function HeaderIcons({
  onHistoryClick,
  onMemoryClick,
  onPartnerClick,
  onSettingsClick,
}: HeaderIconsProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onHistoryClick}
        className="p-2 text-charcoal hover:text-clay transition-colors"
        aria-label="History"
      >
        <ScrollText size={20} />
      </button>
      <button
        onClick={onMemoryClick}
        className="p-2 text-charcoal hover:text-clay transition-colors"
        aria-label="Memory"
      >
        <Brain size={20} />
      </button>
      <button
        onClick={onPartnerClick}
        className="p-2 text-charcoal hover:text-clay transition-colors"
        aria-label="Partner"
      >
        <Link2 size={20} />
      </button>
      <button
        onClick={onSettingsClick}
        className="p-2 text-charcoal hover:text-clay transition-colors"
        aria-label="Settings"
      >
        <Settings size={20} />
      </button>
    </div>
  );
}
