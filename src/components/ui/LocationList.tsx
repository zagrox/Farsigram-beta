import React from 'react';
import { useTranslation } from 'react-i18next';
import { CombinedCountryData } from './CountryCard';

interface LocationListProps {
  countries: CombinedCountryData[];
  loading: boolean;
  error: string | null;
  highlightedLocationId: number | null;
  onLocationHover: (country: CombinedCountryData | null) => void;
  onSelectLocation: (id: number) => void;
}

const LocationListItem: React.FC<{
  country: CombinedCountryData;
  isHighlighted: boolean;
  onHover: (country: CombinedCountryData) => void;
  onSelect: (id: number) => void;
}> = ({ country, isHighlighted, onHover, onSelect }) => {
  const { t } = useTranslation('explore');
  return (
    <div
      id={`location-item-${country.id}`}
      onMouseEnter={() => onHover(country)}
      className={`p-3 rounded-lg transition-colors duration-150 ${isHighlighted ? 'bg-primary/10 dark:bg-primary/20' : ''}`}
    >
      <div className="flex items-center gap-4">
        <img
          src={country.flagUrl}
          alt={`Flag of ${country.commonName}`}
          className="w-10 h-auto object-contain rounded-md border border-neutral-200 dark:border-neutral-700 flex-shrink-0"
          loading="lazy"
        />
        <div className="flex-1 overflow-hidden">
          <p className="font-semibold text-sm text-neutral-800 dark:text-neutral-200 truncate">{country.commonName}</p>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">{country.persianName}</p>
        </div>
        <button 
            onClick={() => onSelect(country.id)}
            className="text-xs font-bold text-primary hover:underline"
        >
            {t('viewDetails')}
        </button>
      </div>
    </div>
  );
};

const LocationListSkeleton: React.FC = () => (
  <div className="space-y-2 animate-pulse p-2">
    {Array.from({ length: 10 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-3">
        <div className="w-10 h-7 bg-neutral-200 dark:bg-neutral-700 rounded-md"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
          <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
);

const LocationList: React.FC<LocationListProps> = ({
  countries,
  loading,
  error,
  highlightedLocationId,
  onLocationHover,
  onSelectLocation,
}) => {
  const { t } = useTranslation('map');

  return (
    <div className="bg-white/70 dark:bg-neutral-900/50 backdrop-blur-sm rounded-xl shadow-lg flex flex-col h-full">
      <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-200 p-4 border-b border-black/10 dark:border-white/10 flex-shrink-0">
        {t('communityListTitle')}
      </h3>
      <div 
        className="overflow-y-auto no-scrollbar flex-grow"
        onMouseLeave={() => onLocationHover(null)} // Clear highlight when mouse leaves the list area
      >
        {loading ? (
          <LocationListSkeleton />
        ) : error ? (
          <p className="p-4 text-center text-red-500">{error}</p>
        ) : (
          <div className="space-y-1 p-2">
            {countries.map(country => (
              <LocationListItem
                key={country.id}
                country={country}
                isHighlighted={highlightedLocationId === country.id}
                onHover={onLocationHover}
                onSelect={onSelectLocation}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationList;