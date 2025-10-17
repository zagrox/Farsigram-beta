import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../components/ui/Button';
import InfluencerCard, { InfluencerCardSkeleton, EnrichedInfluencer } from '../components/ui/InfluencerCard';
import CompactInfluencerCard, { CompactInfluencerCardSkeleton } from '../components/ui/CompactInfluencerCard';
import { ImageCard, ImageCardSkeleton } from '../components/ui/ImageCard';
import { API_BASE_URL } from '../constants';
import InfluencerFilterComponent, { InfluencerFilterState } from '../components/ui/InfluencerFilterComponent';
import { Layout } from '../components/ui/LayoutSwitcher';
import { getSocialNetworkName } from '../utils/socialUtils';


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
interface ApiItem {
  id: number;
  name: string;
}
interface ApiSocialItem {
  id: string;
  name: string;
}

interface InfluencersPageProps {
  onSelectInfluencer: (id: number) => void;
}

const InfluencersPage: React.FC<InfluencersPageProps> = ({ onSelectInfluencer }) => {
  const { t } = useTranslation('influencers');
  const [influencers, setInfluencers] = useState<EnrichedInfluencer[]>([]);
  const [layout, setLayout] = useState<Layout>('card');
  
  // Loading states
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingFilters, setLoadingFilters] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter dropdown data
  const [categories, setCategories] = useState<ApiItem[]>([]);
  const [locations, setLocations] = useState<ApiItem[]>([]);
  const [audiences, setAudiences] = useState<ApiItem[]>([]);
  const [socialNetworks, setSocialNetworks] = useState<ApiSocialItem[]>([]);

  // Filter state
  const [filters, setFilters] = useState<InfluencerFilterState>({
    categoryId: '',
    locationId: '',
    audienceId: '',
    socialNetworkUrl: '',
    gender: 'all',
    isHubMember: false,
  });

  const handleFilterChange = (newFilters: Partial<InfluencerFilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Fetch data for filter dropdowns
  useEffect(() => {
    const fetchFilterData = async () => {
        setLoadingFilters(true);
        try {
            const [categoriesRes, locationsRes, audiencesRes, socialsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/items/categories?filter[status][_eq]=published&fields=id,category_parent&limit=-1`),
                fetch(`${API_BASE_URL}/items/locations?fields=id,country_persian&limit=-1`),
                fetch(`${API_BASE_URL}/items/audiences?filter[status][_eq]=published&fields=id,audience_title&limit=-1`),
                fetch(`${API_BASE_URL}/items/socials?fields=social_network&limit=-1`),
            ]);
            if (!categoriesRes.ok || !locationsRes.ok || !audiencesRes.ok || !socialsRes.ok) {
                throw new Error('Failed to fetch filter data');
            }

            const categoriesData = await categoriesRes.json();
            const locationsData = await locationsRes.json();
            const audiencesData = await audiencesRes.json();
            const socialsData = await socialsRes.json();

            setCategories(categoriesData.data.map((c: { id: number; category_parent: string }) => ({ id: c.id, name: c.category_parent })));
            setLocations(locationsData.data.map((l: { id: number; country_persian: string }) => ({ id: l.id, name: l.country_persian })));
            setAudiences(audiencesData.data.map((a: { id: number; audience_title: string }) => ({ id: a.id, name: a.audience_title })));

            const allSocialLinks: { social_network: string }[] = socialsData.data;
            const uniqueNetworks = [...new Set(allSocialLinks.map(s => s.social_network).filter(Boolean))];
            setSocialNetworks(uniqueNetworks.map(url => ({ id: url, name: getSocialNetworkName(url) })));

        } catch (error) {
            console.error("Failed to fetch filter data:", error);
            setError(t('error')); // Generic error for now
        } finally {
            setLoadingFilters(false);
        }
    };
    fetchFilterData();
  }, [t]);

  // Memoize maps for enriching influencer data
  const categoriesMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);
  const locationsMap = useMemo(() => new Map(locations.map(l => [l.id, l.name])), [locations]);

  // Fetch influencers based on filters
  useEffect(() => {
    const fetchFilteredInfluencers = async () => {
      setLoading(true);
      setError(null);
      
      let url = `${API_BASE_URL}/items/influencers?filter[status][_eq]=published&sort=-date_created`;
      if (filters.categoryId) url += `&filter[influencer_category][_eq]=${filters.categoryId}`;
      if (filters.locationId) url += `&filter[influencer_location][_eq]=${filters.locationId}`;
      if (filters.audienceId) url += `&filter[influencer_audience][audiences_id][_eq]=${filters.audienceId}`;
      if (filters.socialNetworkUrl) url += `&filter[influencer_social][socials_id][social_network][_eq]=${filters.socialNetworkUrl}`;
      if (filters.gender !== 'all') url += `&filter[influencer_gender][_eq]=${filters.gender}`;
      if (filters.isHubMember) url += `&filter[influencer_hub][_eq]=true`;

      try {
        const influencersRes = await fetch(url);
        if (!influencersRes.ok) {
          throw new Error('Network response was not ok');
        }

        const influencersData = await influencersRes.json();

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

    if (!loadingFilters) {
        fetchFilteredInfluencers();
    }
  }, [filters, t, categoriesMap, locationsMap, loadingFilters]);

  const renderSkeletons = () => {
    const skeletonCount = 12;
    switch (layout) {
        case 'list':
            return Array.from({ length: 6 }).map((_, index) => <CompactInfluencerCardSkeleton key={index} />);
        case 'image':
            return Array.from({ length: skeletonCount }).map((_, index) => <ImageCardSkeleton key={index} />);
        case 'card':
        default:
            return Array.from({ length: 8 }).map((_, index) => <InfluencerCardSkeleton key={index} />);
    }
  };

  const getGridClasses = () => {
      switch(layout) {
          case 'list':
            return 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4';
          case 'image':
            return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-6';
          case 'card':
          default:
            return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6';
      }
  }

  return (
    <div className="space-y-8">
      {/* Filters Section */}
      <InfluencerFilterComponent
        filters={filters}
        onFilterChange={handleFilterChange}
        categories={categories}
        locations={locations}
        audiences={audiences}
        socialNetworks={socialNetworks}
        loading={loading || loadingFilters}
        resultsCount={influencers.length}
        layout={layout}
        onLayoutChange={setLayout}
      />

      {/* Influencers Grid Section */}
      <section>
        {(loading || loadingFilters) && (
          <div className={getGridClasses()}>
            {renderSkeletons()}
          </div>
        )}

        {error && (
          <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-red-600 dark:text-red-400 font-semibold">{error}</p>
          </div>
        )}

        {!(loading || loadingFilters) && !error && influencers.length === 0 && (
          <div className="text-center p-8 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
            <p className="text-neutral-500 dark:text-neutral-400 font-semibold">{t('noInfluencers')}</p>
          </div>
        )}

        {!(loading || loadingFilters) && !error && influencers.length > 0 && (
           <div className={getGridClasses()}>
            {influencers.map((influencer) => {
                switch(layout) {
                    case 'list':
                        return <CompactInfluencerCard key={influencer.id} influencer={influencer} onSelectInfluencer={onSelectInfluencer} />;
                    case 'image':
                        return <ImageCard key={influencer.id} imageUrl={influencer.influencer_avatar} title={influencer.influencer_name} onClick={() => onSelectInfluencer(influencer.id)} />;
                    case 'card':
                    default:
                        return <InfluencerCard key={influencer.id} influencer={influencer} onSelectInfluencer={onSelectInfluencer} />;
                }
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default InfluencersPage;