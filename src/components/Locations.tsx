import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import MapComponent from './MapComponent';
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

// --- MAIN COMPONENT ---

const Locations: React.FC = () => {
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

  if (error) {
    return (
      <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="text-red-600 dark:text-red-400 font-semibold">{error}</p>
      </div>
    );
  }

  // Loading state with split-screen skeleton
  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row-reverse lg:gap-8">
        {/* Map Skeleton */}
        <div className="lg:w-1/2">
          <div className="h-[400px] lg:h-[calc(100vh-10rem)] mb-8 lg:mb-0 bg-neutral-200 dark:bg-neutral-700 rounded-xl animate-pulse"></div>
        </div>
        {/* List Skeleton */}
        <div className="lg:w-1/2">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-8 justify-items-center">
            {Array.from({ length: 12 }).map((_, i) => <CountryCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row-reverse lg:gap-8">
      {/* Map Column (Right side on desktop) */}
      <div className="lg:w-1/2">
        {countries.length > 0 &&
          <div className="h-[400px] lg:h-[calc(100vh-10rem)] lg:sticky lg:top-8 mb-8 lg:mb-0 bg-white dark:bg-neutral-800/50 rounded-xl shadow-md overflow-hidden">
            <MapComponent countries={countries} />
          </div>
        }
      </div>
      
      {/* Country List Column (Left side on desktop) */}
      <div className="lg:w-1/2">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-8 justify-items-center">
          {countries.map(country => <CountryCard key={country.id} country={country} />)}
        </div>
      </div>
    </div>
  );
};

export default Locations;