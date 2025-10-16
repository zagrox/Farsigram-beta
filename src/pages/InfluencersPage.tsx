import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../components/ui/Button';
import InfluencerCard, { InfluencerCardSkeleton, EnrichedInfluencer } from '../components/ui/InfluencerCard';
import { API_BASE_URL } from '../constants';

// Raw types from API
interface Influencer {
  id: number;
  status: string;
  influencer_name: string;
  influencer_title: string;
  influencer_category: number;
  influencer_location: number;
  influencer_avatar: string;
}
interface Category {
  id: number;
  category_parent: string;
}
interface Location {
  id: number;
  country_persian: string;
}

interface InfluencersPageProps {
  onSelectInfluencer: (id: number) => void;
}

const InfluencersPage: React.FC<InfluencersPageProps> = ({ onSelectInfluencer }) => {
  const { t } = useTranslation('influencers');
  const [influencers, setInfluencers] = useState<EnrichedInfluencer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInfluencersData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [influencersRes, categoriesRes, locationsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/items/influencers?filter[status][_eq]=published`),
          fetch(`${API_BASE_URL}/items/categories`),
          fetch(`${API_BASE_URL}/items/locations`),
        ]);

        if (!influencersRes.ok || !categoriesRes.ok || !locationsRes.ok) {
          throw new Error('Network response was not ok');
        }

        const influencersData = await influencersRes.json();
        const categoriesData = await categoriesRes.json();
        const locationsData = await locationsRes.json();

        const categoriesMap = new Map<number, string>(categoriesData.data.map((c: Category) => [c.id, c.category_parent]));
        const locationsMap = new Map<number, string>(locationsData.data.map((l: Location) => [l.id, l.country_persian]));

        const enrichedInfluencers = influencersData.data.map((inf: Influencer): EnrichedInfluencer => ({
          id: inf.id,
          influencer_name: inf.influencer_name,
          influencer_title: inf.influencer_title,
          influencer_avatar: inf.influencer_avatar,
          categoryName: categoriesMap.get(inf.influencer_category) || 'N/A',
          locationName: locationsMap.get(inf.influencer_location) || 'N/A',
        }));

        setInfluencers(enrichedInfluencers);
      } catch (err) {
        console.error("Failed to fetch influencers data:", err);
        setError(t('error'));
      } finally {
        setLoading(false);
      }
    };

    fetchInfluencersData();
  }, [t]);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <section className="bg-white dark:bg-neutral-800/50 p-6 md:p-8 rounded-xl shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-semibold">{t('headerTitle')}</h2>
          <p className="mt-1 text-neutral-500 dark:text-neutral-400">{t('headerDescription')}</p>
        </div>
        <Button className="flex-shrink-0">
          {t('createButton')}
        </Button>
      </section>

      {/* Influencers Grid Section */}
      <section>
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <InfluencerCardSkeleton key={index} />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-red-600 dark:text-red-400 font-semibold">{error}</p>
          </div>
        )}

        {!loading && !error && influencers.length === 0 && (
          <div className="text-center p-8 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
            <p className="text-neutral-500 dark:text-neutral-400 font-semibold">{t('noInfluencers')}</p>
          </div>
        )}

        {!loading && !error && influencers.length > 0 && (
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {influencers.map((influencer) => (
              <InfluencerCard 
                key={influencer.id} 
                influencer={influencer} 
                onSelectInfluencer={onSelectInfluencer}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default InfluencersPage;