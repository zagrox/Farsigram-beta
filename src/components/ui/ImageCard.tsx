import React from 'react';
import { ASSETS_URL } from '../../constants';

interface ImageCardProps {
  imageUrl: string;
  title: string;
  onClick: () => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({ imageUrl, title, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="group block text-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-neutral-900 rounded-lg"
      aria-label={title}
    >
      <div className="relative aspect-square bg-neutral-200 dark:bg-neutral-700 rounded-lg overflow-hidden transition-transform duration-300 group-hover:scale-105">
        <img
          src={`${ASSETS_URL}/${imageUrl}`}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
         <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      <h3 className="mt-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200 truncate">{title}</h3>
    </button>
  );
};

export const ImageCardSkeleton: React.FC = () => {
    return (
        <div className="animate-pulse">
            <div className="aspect-square bg-neutral-200 dark:bg-neutral-700 rounded-lg"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mt-2 mx-auto"></div>
        </div>
    );
};