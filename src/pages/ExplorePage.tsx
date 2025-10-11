import React from 'react';
import { useTranslation } from 'react-i18next';
import Locations from '../components/Locations';

const ExplorePage: React.FC = () => {
  const { t } = useTranslation('explore');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{t('title')}</h1>
        <p className="mt-2 text-lg text-neutral-600 dark:text-neutral-400">{t('subtitle')}</p>
      </div>
      <Locations />
    </div>
  );
};

export default ExplorePage;