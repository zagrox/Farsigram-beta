import React from 'react';
import { useTranslation } from 'react-i18next';

const ProfilePage: React.FC = () => {
  const { t } = useTranslation('profile');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{t('title')}</h1>
        <p className="mt-2 text-lg text-neutral-600 dark:text-neutral-400">{t('subtitle')}</p>
      </div>
      <div className="bg-white dark:bg-neutral-800/50 p-8 rounded-xl shadow-md text-center">
        <h2 className="text-xl font-semibold">{t('comingSoonTitle')}</h2>
        <p className="mt-2 text-neutral-500 dark:text-neutral-400">{t('comingSoonDescription')}</p>
        <button className="mt-6 bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors">
          {t('editButton')}
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
