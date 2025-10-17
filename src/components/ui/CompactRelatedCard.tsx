import React from 'react';
import { ASSETS_URL } from '../../constants';

interface CompactRelatedCardProps {
  imageUrl: string;
  title: string;
  onClick: () => void;
}

export const CompactRelatedCard: React.FC<CompactRelatedCardProps> = ({ imageUrl, title, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="group block text-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-neutral-900 rounded-lg"
      aria-label={title}
    >
      <div className="relative w-16 h-16 mx-auto bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden transition-transform duration-300 group-hover:scale-105">
        <img
          src={`${ASSETS_URL}/${imageUrl}`}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <h3 className="mt-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200 truncate">{title}</h3>
    </button>
  );
};

export const CompactRelatedCardSkeleton: React.FC = () => {
    return (
        <div className="animate-pulse text-center">
            <div className="w-16 h-16 mx-auto bg-neutral-200 dark:bg-neutral-700 rounded-full"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mt-2 mx-auto"></div>
        </div>
    );
};
