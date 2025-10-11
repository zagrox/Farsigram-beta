import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

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
}

interface CombinedCountryData {
  id: number;
  code: string;
  persianName: string;
  commonName: string;
  flagUrl: string;
  population: number;
}

// --- SUB-COMPONENTS ---

const CountryCard: React.FC<{ country: CombinedCountryData }> = ({ country }) => {
  return (
    <div className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <div className="aspect-video bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
        <img 
          className="h-full w-full object-cover" 
          src={country.flagUrl} 
          alt={`Flag of ${country.commonName}`} 
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 truncate">{country.commonName}</h3>
        <h4 className="text-md font-medium text-primary">{country.persianName}</h4>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Population: {country.population.toLocaleString()}
        </p>
      </div>
    </div>
  );
};

const LoadingSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md overflow-hidden animate-pulse">
        <div className="aspect-video bg-neutral-200 dark:bg-neutral-700"></div>
        <div className="p-4">
            <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 mb-3"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3"></div>
        </div>
    </div>
);


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
        const farsigramResponse = await fetch('https://crm.farsigram.com/items/locations');
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
            if (!detail) return null;

            return {
              id: loc.id,
              code: loc.country,
              persianName: loc.country_persian,
              commonName: detail.name.common,
              flagUrl: detail.flags.svg,
              population: detail.population,
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {loading 
        ? Array.from({ length: 8 }).map((_, i) => <LoadingSkeleton key={i} />)
        : countries.map(country => <CountryCard key={country.id} country={country} />)
      }
    </div>
  );
};

export default Locations;