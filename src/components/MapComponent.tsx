import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';

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
  flyToLocation?: [number, number] | null;
  flyToZoom?: number;
  onSelectLocation: (id: number) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ countries, flyToLocation, flyToZoom = 2, onSelectLocation }) => {
  const { t } = useTranslation('explore');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.FeatureGroup | null>(null);

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
      
      const timer = setTimeout(() => mapRef.current?.invalidateSize(), 100);

      return () => {
        clearTimeout(timer);
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    }
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (map && countries.length > 0) {
      if (markersRef.current) {
        markersRef.current.clearLayers();
      }

      const markers = countries.map(country => {
        const marker = L.marker(country.latlng);
        
        const popupNode = L.DomUtil.create('div');

        const infoContainer = L.DomUtil.create('div', 'flex items-center gap-3 p-1 font-sans', popupNode);
        const img = L.DomUtil.create('img', 'w-8 h-auto border border-neutral-200 rounded-sm', infoContainer);
        img.src = country.flagUrl;
        img.alt = `Flag of ${country.commonName}`;
        
        const textContainer = L.DomUtil.create('div', '', infoContainer);
        const nameEl = L.DomUtil.create('strong', 'text-neutral-800 text-sm', textContainer);
        nameEl.innerText = country.commonName;
        const persianNameEl = L.DomUtil.create('div', 'text-primary text-xs', textContainer);
        persianNameEl.innerText = country.persianName;

        const button = L.DomUtil.create(
            'button', 
            'view-details-btn mt-2 w-full text-center text-sm font-semibold bg-primary text-white py-1 px-3 rounded-md hover:bg-primary-dark transition-colors', 
            popupNode
        );
        button.innerText = t('viewDetails');

        L.DomEvent.on(button, 'click', (ev) => {
            L.DomEvent.stopPropagation(ev);
            onSelectLocation(country.id);
            map.closePopup();
        });
        
        marker.bindPopup(popupNode);
        return marker;
      });

      markersRef.current = L.featureGroup(markers).addTo(map);
    }
  }, [countries, onSelectLocation, t]);

  useEffect(() => {
    const map = mapRef.current;
    if (map && flyToLocation) {
        map.flyTo(flyToLocation, flyToZoom, {
            animate: true,
            duration: 1.5
        });
    }
  }, [flyToLocation, flyToZoom]);


  return <div ref={mapContainerRef} className="z-0 w-full h-full" />;
};

export default MapComponent;