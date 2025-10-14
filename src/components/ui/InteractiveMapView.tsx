import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../../constants';
import { CombinedCountryData } from './CountryCard';
import MapComponent from '../MapComponent';
import { arraysAreEqual } from '../../utils/arrayUtils';

const InteractiveMapView: React.FC = () => {
    const { t } = useTranslation('explore');
    const [countries, setCountries] = useState<CombinedCountryData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);

    useEffect(() => {
        const fetchLocations = async () => {
            setLoading(true);
            setError(null);
            try {
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
                    .sort((a, b) => a.commonName.localeCompare(b.commonName));

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
        <div className="space-y-2 animate-pulse p-2">
            {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-2">
                    <div className="w-10 h-7 bg-neutral-300 dark:bg-neutral-700 rounded-md"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-3/4"></div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="relative h-[calc(100vh-10rem)] w-full bg-neutral-200 dark:bg-neutral-800 rounded-xl shadow-lg overflow-hidden">
            <MapComponent countries={countries} flyToLocation={selectedLocation} flyToZoom={6} />
            
            <div className="absolute left-4 top-4 bottom-4 w-72 bg-white/70 dark:bg-black/50 backdrop-blur-sm rounded-xl shadow-lg flex flex-col overflow-hidden">
                <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-200 p-4 border-b border-black/10 dark:border-white/10 flex-shrink-0">
                    {t('communityListTitle')}
                </h3>
                <div className="overflow-y-auto no-scrollbar flex-grow">
                    {loading ? (
                        renderSkeleton()
                    ) : error ? (
                        <p className="p-4 text-center text-red-500">{error}</p>
                    ) : (
                        <div className="space-y-1 p-2">
                            {countries.map(country => {
                                const isActive = selectedLocation ? arraysAreEqual(country.latlng, selectedLocation) : false;
                                return (
                                    <button 
                                        key={country.id} 
                                        onClick={() => setSelectedLocation(country.latlng)}
                                        className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors duration-200 ${
                                            isActive 
                                                ? 'bg-primary/20 dark:bg-primary/30' 
                                                : 'hover:bg-black/5 dark:hover:bg-white/10'
                                        }`}
                                    >
                                        <img 
                                            src={country.flagUrl} 
                                            alt={`Flag of ${country.commonName}`}
                                            className="w-10 h-auto object-contain rounded-md border border-neutral-200 dark:border-neutral-700 flex-shrink-0"
                                            loading="lazy"
                                        />
                                        <div>
                                            <p className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">{country.commonName}</p>
                                            <p className="text-xs text-neutral-600 dark:text-neutral-400">{country.persianName}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InteractiveMapView;