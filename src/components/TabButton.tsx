interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function TabButton({ active, onClick, icon, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`min-w-0 flex-1 flex items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-xs font-semibold transition-all sm:gap-1.5 sm:px-3 sm:text-sm ${
        active ? 'bg-white text-earth-800 shadow-sm' : 'text-earth-500 hover:text-earth-700'
      }`}
    >
      {icon}
      <span className="truncate">{children}</span>
    </button>
  );
}
