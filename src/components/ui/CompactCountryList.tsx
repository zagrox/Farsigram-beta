import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CombinedCountryData } from './CountryCard';
import { API_BASE_URL } from '../../constants';
import { UsersIcon } from '../Icons';

const formatPopulation = (pop: number): string => {
    if (pop >= 1000000) {
        return (pop / 1000000).toFixed(1) + 'M';
    }
    if (pop >= 1000) {
        return (pop / 1000).toFixed(1) + 'K';
    }
    return pop.toString();
};

const CompactCountryList: React.FC = () => {
    const { t } = useTranslation('explore');
    const [countries, setCountries] = useState<CombinedCountryData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLocations = async () => {
            setLoading(true);
            setError(null);
            try {
                // This logic is duplicated from Locations.tsx. In a larger app, this would be a custom hook.
                const farsigramResponse = await fetch(`${API_BASE_URL}/items/locations`);
                if (!farsigramResponse.ok) throw new Error('Failed to fetch Farsigram locations');
                const farsigramData = await farsigramResponse.json();
                
                const detailPromises = farsigramData.data.map((loc: any) =>
                  fetch(`https://restcountries.com/v3.1/alpha/${loc.country}`)
                    .then(res => res.ok ? res.json() : null)
                );

                const detailsResults = await Promise.all(detailPromises);

                const combinedData = farsigramData.data
                    .map((loc: any, index: number) => {
                        const detail = detailsResults[index]?.[0];
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
                    .filter((item: CombinedCountryData | null): item is CombinedCountryData => item !== null)
                    .sort((a: CombinedCountryData, b: CombinedCountryData) => b.population - a.population); // Sort by population descending

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

    const renderSkeleton = () => (
        <div className="space-y-3 animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-2">
                    <div className="w-10 h-7 bg-neutral-200 dark:bg-neutral-700 rounded-md"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
                        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
                    </div>
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/6"></div>
                </div>
            ))}
        </div>
    );
    
    return (
        <div className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md p-6 h-full">
            <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 mb-4">{t('directoryTitle')}</h3>
            {loading ? (
                renderSkeleton()
            ) : error ? (
                <p className="text-center text-red-500">{error}</p>
            ) : (
                <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-14rem)] no-scrollbar pr-2">
                    {countries.map(country => (
                        <div key={country.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200">
                            <img 
                                src={country.flagUrl} 
                                alt={`Flag of ${country.commonName}`}
                                className="w-10 h-auto object-contain rounded-md border border-neutral-200 dark:border-neutral-700"
                                loading="lazy"
                            />
                            <div className="flex-1">
                                <p className="font-semibold text-neutral-800 dark:text-neutral-200">{country.commonName}</p>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">{country.persianName}</p>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-300 font-medium">
                                <UsersIcon className="w-4 h-4 text-neutral-400" />
                                <span>{formatPopulation(country.population)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CompactCountryList;
