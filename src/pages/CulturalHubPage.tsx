import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../components/ui/Button';

const CulturalHubPage: React.FC = () => {
  const { t } = useTranslation('culturalhub');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{t('title')}</h1>
        <p className="mt-2 text-lg text-neutral-600 dark:text-neutral-400">{t('subtitle')}</p>
      </div>
      <div className="bg-white dark:bg-neutral-800/50 p-8 rounded-xl shadow-md text-center">
        <h2 className="text-xl font-semibold">{t('celebrationTitle')}</h2>
        <p className="mt-2 text-neutral-500 dark:text-neutral-400">{t('celebrationDescription')}</p>
        <Button variant="secondary">
          {t('shareButton')}
        </Button>
      </div>
    </div>
  );
};

export default CulturalHubPage;
