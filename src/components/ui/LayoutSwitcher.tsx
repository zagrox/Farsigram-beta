import React from 'react';
import { useTranslation } from 'react-i18next';
import { CategoryIcon, Bars3Icon, PhotoIcon } from '../Icons';

export type Layout = 'card' | 'list' | 'image';

interface LayoutSwitcherProps {
  currentLayout: Layout;
  onLayoutChange: (layout: Layout) => void;
}

const LayoutSwitcher: React.FC<LayoutSwitcherProps> = ({ currentLayout, onLayoutChange }) => {
  const { t } = useTranslation('influencers');

  const layoutOptions: { name: Layout; labelKey: string; icon: React.ReactNode }[] = [
    { name: 'card', labelKey: 'layout_card', icon: <CategoryIcon className="w-5 h-5" /> },
    { name: 'list', labelKey: 'layout_list', icon: <Bars3Icon className="w-5 h-5" /> },
    { name: 'image', labelKey: 'layout_image', icon: <PhotoIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
      {layoutOptions.map((option) => (
        <button
          key={option.name}
          onClick={() => onLayoutChange(option.name)}
          title={t(option.labelKey)}
          aria-label={t(option.labelKey)}
          aria-pressed={currentLayout === option.name}
          className={`p-2 rounded-md transition-colors ${
            currentLayout === option.name
              ? 'bg-white dark:bg-neutral-900 text-primary shadow-sm'
              : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50'
          }`}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
};

export default LayoutSwitcher;