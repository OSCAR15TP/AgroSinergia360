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
      className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
        active ? 'bg-white text-earth-800 shadow-sm' : 'text-earth-500 hover:text-earth-700'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
