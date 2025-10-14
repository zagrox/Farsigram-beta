import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';

interface SectionHeaderProps {
  title: string;
  onViewAll?: () => void;
  className?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, onViewAll, className = '' }) => {
  const { t, i18n } = useTranslation('common');
  const isRtl = i18n.dir() === 'rtl';

  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{title}</h2>
      {onViewAll && (
        <button
          onClick={onViewAll}
          className="flex items-center text-sm font-semibold text-primary hover:text-primary-dark dark:hover:text-primary-light transition-colors"
        >
          <span>{t('viewAll')}</span>
          {isRtl ? (
            <ChevronLeftIcon className="w-4 h-4 mr-1" />
          ) : (
            <ChevronRightIcon className="w-4 h-4 ml-1" />
          )}
        </button>
      )}
    </div>
  );
};

export default SectionHeader;