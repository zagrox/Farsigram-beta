import React from 'react';
import { XMarkIcon } from '../Icons';

interface ActiveFilterPillProps {
  label: string;
  onClear: () => void;
  disabled?: boolean;
}

const ActiveFilterPill: React.FC<ActiveFilterPillProps> = ({ label, onClear, disabled = false }) => {
  return (
    <div className={`flex items-center justify-between gap-2 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light text-sm font-semibold h-[42px] px-3 rounded-md transition-colors ${disabled ? 'opacity-50' : ''}`}>
      <span className="truncate" title={label}>{label}</span>
      <button
        onClick={onClear}
        disabled={disabled}
        className="p-1 rounded-full hover:bg-primary/20 dark:hover:bg-primary/30 disabled:hover:bg-transparent"
        aria-label={`Clear filter: ${label}`}
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ActiveFilterPill;