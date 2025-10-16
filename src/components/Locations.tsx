import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CombinedCountryData, CountryCard, CountryCardSkeleton } from './ui/CountryCard';
import { API_BASE_URL } from '../constants';

// --- TYPE DEFINITIONS ---

interface FarsigramLocation {
  id: number;
  country: string; // e.g. "TR"
  country_persian: string;
}

interface RestCountry {
  name: {
    common: string;
    official: string;
  };
  flags: {
    svg: string;
    png: string;
  };
  population: number;
  latlng: [number, number];
}

// FIX: Added props interface to make the component interactive
interface CountryGridProps {
  onSelectLocation: (id: number) => void;
}

// --- MAIN COMPONENT ---

const CountryGrid: React.FC<CountryGridProps> = ({ onSelectLocation }) => {
  const { t } = useTranslation('explore');
  const [countries, setCountries] = useState<CombinedCountryData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);
      setError(null);
      try {
        const farsigramResponse = await fetch(`${API_BASE_URL}/items/locations`);
        if (!farsigramResponse.ok) throw new Error('Failed to fetch Farsigram locations');
        const farsigramData = await farsigramResponse.json();
        const locations: FarsigramLocation[] = farsigramData.data;

        const detailPromises = locations.map(loc =>
          fetch(`https://restcountries.com/v3.1/alpha/${loc.country}`)
            .then(res => res.ok ? res.json() : null)
        );

        const detailsResults = await Promise.all(detailPromises);

        const combinedData = locations
          .map((loc, index) => {
            const detail = detailsResults[index]?.[0] as RestCountry | undefined;
            if (!detail || !detail.latlng) return null;

            return {
              id: loc.id,
              code: loc.country,
              persianName: loc.country_persian,
              commonName: detail.name.common,
              flagUrl: detail.flags.svg,
              population: detail.population,
              latlng: detail.latlng,
            };
          })
          .filter((item): item is CombinedCountryData => item !== null);

        setCountries(combinedData);
      } catch (err) {
        setError(t('errorLoadingLocations'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [t]);


  return (
    <div className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md p-6 h-full">
      <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 mb-4">{t('gridTitle')}</h3>
      
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-8 justify-items-center">
            {Array.from({ length: 12 }).map((_, i) => <CountryCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-red-600 dark:text-red-400 font-semibold">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 justify-items-center">
            {/* FIX: Passed the onSelect prop to CountryCard to handle clicks. */}
            {countries.map(country => <CountryCard key={country.id} country={country} onSelect={() => onSelectLocation(country.id)} />)}
        </div>
      )}
    </div>
  );
};

export default CountryGrid;
