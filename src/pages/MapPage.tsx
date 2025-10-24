import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../constants';
import MapComponent from '../components/MapComponent';
import LocationList from '../components/ui/LocationList';
import { CombinedCountryData } from '../components/ui/CountryCard';

// Type definitions moved here as they are fetched and managed by this parent component.
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

interface MapPageProps {
  onSelectLocation: (id: number) => void;
}

const MapPage: React.FC<MapPageProps> = ({ onSelectLocation }) => {
  const { t } = useTranslation(['map', 'explore']);
  
  const [countries, setCountries] = useState<CombinedCountryData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for interactivity between list and map
  const [flyToLocation, setFlyToLocation] = useState<[number, number] | null>(null);
  const [highlightedLocationId, setHighlightedLocationId] = useState<number | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);
      setError(null);
      try {
        const farsigramResponse = await fetch(`${API_BASE_URL}/items/locations`);
        if (!farsigramResponse.ok) throw new Error('Failed to fetch Farsigram locations');
        const farsigramData = await farsigramResponse.json();
        const locations: FarsigramLocation[] = farsigramData?.data ?? [];
        
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
          .filter((item): item is CombinedCountryData => item !== null)
          .sort((a, b) => a.commonName.localeCompare(b.commonName)); // Sort alphabetically

        setCountries(combinedData);
      } catch (err) {
        setError(t('explore:errorLoadingLocations'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [t]);

  const handleLocationHover = (country: CombinedCountryData | null) => {
    if (country) {
      setFlyToLocation(country.latlng);
      setHighlightedLocationId(country.id);
    } else {
      // Optional: reset view or do nothing on mouse out
      setHighlightedLocationId(null);
    }
  };

  const handleMarkerClick = (country: CombinedCountryData) => {
    setHighlightedLocationId(country.id);
    const listElement = document.getElementById(`location-item-${country.id}`);
    listElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-10rem)]">
      {/* Left Panel: Location List */}
      <div className="w-full md:w-1/3 lg:w-1/4 h-1/2 md:h-full">
        <LocationList
          countries={countries}
          loading={loading}
          error={error}
          highlightedLocationId={highlightedLocationId}
          onLocationHover={handleLocationHover}
          onSelectLocation={onSelectLocation}
        />
      </div>
      
      {/* Right Panel: Map */}
      <div className="w-full md:w-2/3 lg:w-3/4 h-1/2 md:h-full rounded-xl shadow-lg overflow-hidden">
        <MapComponent
          countries={countries}
          flyToLocation={flyToLocation}
          flyToZoom={6}
          onSelectLocation={onSelectLocation}
          onMarkerClick={handleMarkerClick}
        />
      </div>
    </div>
  );
};

export default MapPage;