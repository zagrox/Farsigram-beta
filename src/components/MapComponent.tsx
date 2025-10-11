import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface CombinedCountryData {
  id: number;
  commonName: string;
  latlng: [number, number];
  flagUrl: string;
  persianName: string;
}

interface MapComponentProps {
  countries: CombinedCountryData[];
}

const MapComponent: React.FC<MapComponentProps> = ({ countries }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.FeatureGroup | null>(null);

  // Effect for map initialization (runs once on mount)
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
      }).setView([20, 0], 2);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapRef.current);
      
      L.control.zoom({ position: 'topright' }).addTo(mapRef.current);
      
      // This ensures the map resizes correctly after the container has settled its dimensions
      const timer = setTimeout(() => mapRef.current?.invalidateSize(), 100);

      return () => {
        clearTimeout(timer);
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    }
  }, []); // Empty dependency array ensures this runs only once

  // Effect for updating markers when countries data changes
  useEffect(() => {
    const map = mapRef.current;
    if (map && countries.length > 0) {
      // Clear existing markers
      if (markersRef.current) {
        markersRef.current.clearLayers();
      }

      const markers = countries.map(country => {
        const popupContent = `
            <div class="flex items-center gap-3 p-1 font-sans">
                <img src="${country.flagUrl}" alt="Flag of ${country.commonName}" class="w-8 h-auto border border-neutral-200 rounded-sm">
                <div>
                    <strong class="text-neutral-800 text-sm">${country.commonName}</strong>
                    <div class="text-primary text-xs">${country.persianName}</div>
                </div>
            </div>
        `;
        return L.marker(country.latlng).bindPopup(popupContent);
      });

      markersRef.current = L.featureGroup(markers).addTo(map);
      
      if (markersRef.current.getBounds().isValid()) {
        map.fitBounds(markersRef.current.getBounds().pad(0.2));
      }
    }
  }, [countries]);

  return <div ref={mapContainerRef} className="z-0 w-full h-full" />;
};

export default MapComponent;