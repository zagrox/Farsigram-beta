import React from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../components/ui/Card';

const HomePage: React.FC = () => {
  const { t } = useTranslation('home');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{t('title')}</h1>
        <p className="mt-2 text-lg text-neutral-600 dark:text-neutral-400">{t('subtitle')}</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Card 
          title={t('featuredCreatorTitle')}
          description={t('featuredCreatorDescription')}
          imageUrl="https://picsum.photos/seed/creator/600/400"
        />
        <Card 
          title={t('trendingCampaignTitle')}
          description={t('trendingCampaignDescription')}
          imageUrl="https://picsum.photos/seed/campaign/600/400"
        />
        <Card 
          title={t('culturalSpotlightTitle')}
          description={t('culturalSpotlightDescription')}
          imageUrl="https://picsum.photos/seed/culture/600/400"
        />
         <Card 
          title={t('newInMarketplaceTitle')}
          description={t('newInMarketplaceDescription')}
          imageUrl="https://picsum.photos/seed/market/600/400"
        />
         <Card 
          title={t('communityStoryTitle')}
          description={t('communityStoryDescription')}
          imageUrl="https://picsum.photos/seed/community/600/400"
        />
         <Card 
          title={t('upcomingEventTitle')}
          description={t('upcomingEventDescription')}
          imageUrl="https://picsum.photos/seed/event/600/400"
        />
      </div>
    </div>
  );
};

export default HomePage;
