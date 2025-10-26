interface OptionButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function OptionButton({ label, onClick, disabled = false }: OptionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 bg-white border-2 border-blue-500 text-blue-600 rounded-full font-medium text-sm hover:bg-blue-50 hover:border-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
    >
      {label}
    </button>
  );
}
