import React from 'react';
import InteractiveMapView from '../components/ui/InteractiveMapView';

interface ExplorePageProps {
  onSelectLocation: (id: number) => void;
}

const ExplorePage: React.FC<ExplorePageProps> = ({ onSelectLocation }) => {
  return (
    <div>
      <InteractiveMapView onSelectLocation={onSelectLocation} />
    </div>
  );
};

export default ExplorePage;
