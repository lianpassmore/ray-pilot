import { Menu } from "lucide-react";

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
        className="p-2 text-charcoal hover:bg-charcoal/5 rounded-sm transition-all duration-200 active:scale-95"
        aria-label="Open Menu"
      >
        {/* Thin stroke (1.5) matches the editorial font weight */}
        <Menu size={24} strokeWidth={1.5} />
      </button>
    </div>
  );
}