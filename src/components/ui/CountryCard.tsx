import React from 'react';

// --- TYPE DEFINITIONS ---
export interface CombinedCountryData {
  id: number;
  code: string;
  persianName: string;
  commonName: string;
  flagUrl: string;
  population: number;
  latlng: [number, number];
}

interface CountryCardProps {
    country: CombinedCountryData;
    onSelect: () => void;
}

// --- SUB-COMPONENTS ---

export const CountryCard: React.FC<CountryCardProps> = ({ country, onSelect }) => {
  return (
    <button 
        onClick={onSelect}
        className="relative group flex-shrink-0 snap-start cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-neutral-900 rounded-2xl" 
        aria-label={country.commonName}
    >
      <img 
        className="w-24 h-24 rounded-2xl object-cover border-4 border-neutral-100 dark:border-neutral-800 shadow-lg transition-transform duration-300 group-hover:scale-110" 
        src={country.flagUrl} 
        alt={`Flag of ${country.commonName}`} 
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center p-2 pointer-events-none">
        <h3 className="font-bold text-sm text-white" title={country.commonName}>
          {country.commonName}
        </h3>
        <h4 className="text-xs text-primary-light">
          {country.persianName}
        </h4>
      </div>
    </button>
  );
};

export const CountryCardSkeleton: React.FC = () => (
    <div className="relative flex-shrink-0 snap-start animate-pulse">
        <div className="w-24 h-24 bg-neutral-200 dark:bg-neutral-700 rounded-2xl border-4 border-neutral-100 dark:border-neutral-800"></div>
    </div>
);
