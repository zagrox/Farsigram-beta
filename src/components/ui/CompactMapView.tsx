import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../../constants';
import { CombinedCountryData } from './CountryCard';
import MapComponent from '../MapComponent';

// --- TYPE DEFINITIONS (duplicated for component independence) ---
interface FarsigramLocation {
  id: number;
  country: string;
  country_persian: string;
}

interface RestCountry {
  name: { common: string };
  flags: { svg: string };
  population: number;
  latlng: [number, number];
}

const CompactMapView: React.FC = () => {
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
        <div className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 mb-4">{t('mapTitle')}</h3>
            
            {loading && <div className="aspect-video bg-neutral-200 dark:bg-neutral-700 rounded-lg animate-pulse"></div>}
            
            {error && (
                 <div className="aspect-video flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-red-600 dark:text-red-400 font-semibold">{error}</p>
                 </div>
            )}

            {!loading && !error && countries.length > 0 && (
                <div className="aspect-video rounded-lg overflow-hidden shadow-inner">
                    {/* FIX: Pass a no-op function for the required onSelectLocation prop to resolve the type error. */}
                    <MapComponent countries={countries} onSelectLocation={() => {}} />
                </div>
            )}
        </div>
    );
};

export default CompactMapView;