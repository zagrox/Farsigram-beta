import React from 'react';
import { useTranslation } from 'react-i18next';
import Locations from '../components/Locations';

const ExplorePage: React.FC = () => {
  const { t } = useTranslation('explore');

  return (
    <div className="space-y-8">
      <Locations />
    </div>
  );
};

export default ExplorePage;