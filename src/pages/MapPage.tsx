import React from 'react';
import InteractiveMapView from '../components/ui/InteractiveMapView';

interface MapPageProps {
  onSelectLocation: (id: number) => void;
}

const MapPage: React.FC<MapPageProps> = ({ onSelectLocation }) => {
  return (
    <div>
      <InteractiveMapView onSelectLocation={onSelectLocation} />
    </div>
  );
};

export default MapPage;
