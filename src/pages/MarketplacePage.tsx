import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../components/ui/Button';

const MarketplacePage: React.FC = () => {
  const { t } = useTranslation('marketplace');

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-neutral-800/50 p-8 rounded-xl shadow-md text-center">
        <h2 className="text-2xl font-semibold">{t('comingSoonTitle')}</h2>
        <p className="mt-2 text-neutral-500 dark:text-neutral-400">{t('comingSoonDescription')}</p>
        <Button>
          {t('sellerButton')}
        </Button>
      </div>
    </div>
  );
};

export default MarketplacePage;